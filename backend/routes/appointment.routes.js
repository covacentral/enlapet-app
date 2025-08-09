// backend/routes/appointment.routes.js
// Define los endpoints PROTEGIDOS para la gestión de citas.

const { Router } = require('express');
const { requestAppointment } = require('../controllers/appointment.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación por defecto
// (ya que se registrarán después del middleware authenticateUser en index.js).

// URL: /api/appointments/request
// Método: POST
// Función: Permite a un usuario solicitar una nueva cita para su mascota.
router.post('/appointments/request', requestAppointment);


module.exports = router;