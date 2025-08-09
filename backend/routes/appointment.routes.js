// backend/routes/appointment.routes.js
// Define los endpoints PROTEGIDOS para la gestión de citas.

const { Router } = require('express');
// 1. Importamos la nueva función del controlador
const { 
    requestAppointment, 
    getAvailableSlots, 
    getMyAppointments,
    updateAppointmentStatus
} = require('../controllers/appointment.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación por defecto.

// URL: /api/appointments
// Método: GET
router.get('/appointments', getMyAppointments);

// URL: /api/appointments/request
// Método: POST
router.post('/appointments/request', requestAppointment);

// URL: /api/appointments/slots/:vetId?date=YYYY-MM-DD
// Método: GET
router.get('/appointments/slots/:vetId', getAvailableSlots);

// --- 2. [NUEVO] Ruta para actualizar el estado de una cita ---
// URL: /api/appointments/:appointmentId/status
// Método: PUT
router.put('/appointments/:appointmentId/status', updateAppointmentStatus);


module.exports = router;