// backend/routes/appointment.routes.js
// Define los endpoints PROTEGIDOS para la gestión de citas.

const { Router } = require('express');
// 1. Importamos la nueva función del controlador
const { 
    requestAppointment, 
    getAvailableSlots, 
    getMyAppointments 
} = require('../controllers/appointment.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación por defecto.

// URL: /api/appointments
// Método: GET
// Función: Obtiene todas las citas relevantes para el usuario autenticado.
router.get('/appointments', getMyAppointments);

// URL: /api/appointments/request
// Método: POST
// Función: Permite a un usuario solicitar una nueva cita para su mascota.
router.post('/appointments/request', requestAppointment);

// URL: /api/appointments/slots/:vetId?date=YYYY-MM-DD
// Método: GET
// Función: Devuelve los horarios disponibles para un veterinario en una fecha específica.
router.get('/appointments/slots/:vetId', getAvailableSlots);


module.exports = router;