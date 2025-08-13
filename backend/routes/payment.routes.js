// backend/routes/payment.routes.js
// Define los endpoints PROTEGIDOS para la gestión de pagos con ePayco.

const { Router } = require('express');
const { createPaymentTransaction } = require('../controllers/payment.controller');

const router = Router();

// --- Ruta Protegida (requiere autenticación) ---

// URL: /api/payments/create-transaction
// Método: POST
// Función: Crea una nueva transacción en ePayco para una orden existente.
router.post('/payments/create-transaction', createPaymentTransaction);

module.exports = router;