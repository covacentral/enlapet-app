// backend/routes/product.routes.js
// Define los endpoints PÚBLICOS para la gestión de productos de la tienda.

const { Router } = require('express');
const { getActiveProducts, getProductById } = require('../controllers/product.controller');

const router = Router();

// --- Rutas Públicas (no requieren autenticación) ---

// URL: /api/public/products
// Método: GET
// Función: Obtiene una lista de todos los productos activos en la tienda.
router.get('/public/products', getActiveProducts);

// URL: /api/public/products/:productId
// Método: GET
// Función: Obtiene los detalles de un producto específico por su ID.
router.get('/public/products/:productId', getProductById);


module.exports = router;