// backend/routes/order.routes.js
// Define los endpoints PROTEGIDOS para la gestión de órdenes de compra.
// VERSIÓN ACTUALIZADA: Añade la ruta para obtener el historial de órdenes.

const { Router } = require('express');
// 1. Importamos la nueva función getMyOrders
const { createOrder, getMyOrders } = require('../controllers/order.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// URL: /api/orders
// Método: POST
// Función: Crea una nueva orden de compra para el usuario autenticado.
router.post('/orders', createOrder);

// --- NUEVA RUTA ---
// URL: /api/orders
// Método: GET
// Función: Obtiene el historial de órdenes del usuario autenticado.
router.get('/orders', getMyOrders);


module.exports = router;