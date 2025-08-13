// backend/controllers/order.controller.js
// VERSIÓN 2.0: Añade la función para obtener una orden específica por ID.

const { db } = require('../config/firebase');
const { getNewOrder } = require('../models/order.model');

const createOrder = async (req, res) => {
    // ... (esta función no cambia)
    const { uid: userId } = req.user;
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
        return res.status(400).json({ message: 'Se requieren productos y una dirección de envío.' });
    }

    try {
        const productIds = items.map(item => item.productId);
        const productsRef = db.collection('products');
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
            totalAmount += productData.price.amount * cartItem.quantity;
            validatedItems.push({
                productId: doc.id,
                name: productData.name,
                quantity: cartItem.quantity,
                unitPrice: productData.price.amount,
            });
        });

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
            totalAmount: newOrderData.totalAmount
        });

    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({ message: error.message || 'Error interno al crear la orden.' });
    }
};

const getMyOrders = async (req, res) => {
    // ... (esta función no cambia)
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

/**
 * [NUEVO] Obtiene una orden específica por su ID.
 */
const getOrderById = async (req, res) => {
    const { uid: userId } = req.user;
    const { orderId } = req.params;

    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        const orderData = orderDoc.data();
        // Verificación de seguridad: el usuario solo puede ver sus propias órdenes
        if (orderData.userId !== userId) {
            return res.status(403).json({ message: 'No autorizado para ver esta orden.' });
        }

        res.status(200).json({ id: orderDoc.id, ...orderData });
    } catch (error) {
        console.error(`Error en getOrderById para la orden ${orderId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener la orden.' });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById // Exportamos la nueva función
};