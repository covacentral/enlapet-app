// backend/controllers/order.controller.js
// Lógica de negocio para la creación y gestión de órdenes de compra.
// VERSIÓN ACTUALIZADA: Añade la función para obtener el historial de órdenes de un usuario.

const { db } = require('../config/firebase');
const { getNewOrder } = require('../models/order.model');

/**
 * Crea una nueva orden de compra.
 * Es un endpoint protegido que requiere autenticación.
 */
const createOrder = async (req, res) => {
    const { uid: userId } = req.user;
    const { items, shippingAddress } = req.body;

    // Validación básica de la entrada
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
        return res.status(400).json({ message: 'Se requieren productos y una dirección de envío.' });
    }

    try {
        const productIds = items.map(item => item.productId);
        const productsRef = db.collection('products');
        // Usamos una consulta 'in' para obtener todos los productos del carrito en una sola llamada a DB
        const productsSnapshot = await productsRef.where('__name__', 'in', productIds).get();

        if (productsSnapshot.size !== productIds.length) {
            return res.status(404).json({ message: 'Uno o más productos no fueron encontrados.' });
        }

        let totalAmount = 0;
        const validatedItems = [];

        productsSnapshot.forEach(doc => {
            const productData = doc.data();
            const cartItem = items.find(item => item.productId === doc.id);

            if (!productData.isActive) {
                throw new Error(`El producto "${productData.name}" ya no está disponible.`);
            }

            // --- PASO DE SEGURIDAD CRÍTICO ---
            // Recalculamos el total en el backend usando el precio de la base de datos,
            // ignorando cualquier precio que pudiera haber sido enviado desde el frontend.
            totalAmount += productData.price.amount * cartItem.quantity;

            validatedItems.push({
                productId: doc.id,
                name: productData.name,
                quantity: cartItem.quantity,
                unitPrice: productData.price.amount, // Precio en centavos desde la DB
            });
        });

        // Creamos la nueva orden usando nuestro modelo
        const newOrderData = getNewOrder({
            userId,
            items: validatedItems,
            totalAmount,
            shippingAddress
        });

        const orderRef = await db.collection('orders').add(newOrderData);

        res.status(201).json({ 
            message: 'Orden creada exitosamente. Procede al pago.',
            orderId: orderRef.id,
            totalAmount: newOrderData.totalAmount // Devolvemos el total calculado para confirmación
        });

    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ message: error.message || 'Error interno al crear la orden.' });
    }
};

/**
 * [NUEVO] Obtiene el historial de órdenes del usuario autenticado.
 */
const getMyOrders = async (req, res) => {
    const { uid: userId } = req.user;

    try {
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        if (ordersSnapshot.empty) {
            return res.status(200).json([]);
        }

        const ordersList = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(ordersList);

    } catch (error) {
        console.error('Error en getMyOrders:', error);
        res.status(500).json({ message: 'Error interno al obtener el historial de órdenes.' });
    }
};


module.exports = {
    createOrder,
    getMyOrders // Exportamos la nueva función
};