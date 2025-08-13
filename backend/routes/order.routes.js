// backend/routes/order.routes.js
// VERSIÓN 2.0: Añade la ruta para obtener una orden específica por su ID.

const { Router } = require('express');
// 1. Importamos la nueva función getOrderById
const { createOrder, getMyOrders, getOrderById } = require('../controllers/order.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// Crea una nueva orden de compra
router.post('/orders', createOrder);

// Obtiene el historial de órdenes del usuario
router.get('/orders', getMyOrders);

// --- NUEVA RUTA ---
// URL: /api/orders/:orderId
// Método: GET
// Función: Obtiene los detalles de una orden específica.
router.get('/orders/:orderId', getOrderById);


module.exports = router;