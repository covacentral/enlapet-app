// backend/controllers/product.controller.js
// Lógica de negocio para la gestión de productos de la tienda.

const { db } = require('../config/firebase');

/**
 * Obtiene la lista de todos los productos activos.
 * Esta ruta es pública y no requiere autenticación.
 */
const getActiveProducts = async (req, res) => {
    try {
        const productsSnapshot = await db.collection('products').where('isActive', '==', true).get();
        
        if (productsSnapshot.empty) {
            return res.status(200).json([]);
        }

        const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.status(200).json(productsList);

    } catch (error) {
        console.error('Error en getActiveProducts:', error);
        res.status(500).json({ message: 'Error interno al obtener los productos.' });
    }
};

/**
 * Obtiene los detalles de un producto específico por su ID.
 * Esta ruta es pública y no requiere autenticación.
 */
const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const productDoc = await db.collection('products').doc(productId).get();

        if (!productDoc.exists) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        res.status(200).json({ id: productDoc.id, ...productDoc.data() });

    } catch (error) {
        console.error(`Error en getProductById para productId ${req.params.productId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener el producto.' });
    }
};

module.exports = {
    getActiveProducts,
    getProductById
};