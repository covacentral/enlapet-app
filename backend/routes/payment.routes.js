// backend/routes/payment.routes.js
// Define los endpoints para la gestión de pagos con ePayco.

const { Router } = require('express');
const { createPaymentTransaction, handleEpaycoWebhook } = require('../controllers/payment.controller');

const router = Router();


// --- Ruta Protegida (requiere autenticación) ---

// URL: /api/payments/create-transaction
// Método: POST
// Función: Crea una nueva transacción en ePayco para una orden existente.
router.post('/payments/create-transaction', createPaymentTransaction);


// --- Ruta Pública (para el webhook de ePayco) ---

// URL: /api/payments/webhook
// Método: POST
// Función: Recibe las notificaciones de confirmación de pago desde ePayco.
// Esta ruta NO debe tener el middleware de autenticación, ya que es ePayco quien la llama.
// La seguridad se maneja validando la transacción internamente en el controlador.
router.post('/payments/webhook', handleEpaycoWebhook);


module.exports = router;