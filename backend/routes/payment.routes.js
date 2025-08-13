// backend/routes/payment.routes.js
// VERSIÓN SIMPLIFICADA: Ya no se necesita después de mover la lógica de creación de pago al frontend.
// El webhook se maneja directamente en index.js como una ruta pública.

const { Router } = require('express');
const router = Router();

// No hay rutas protegidas de pago necesarias en esta arquitectura.

module.exports = router;