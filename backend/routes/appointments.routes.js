// backend/routes/appointments.routes.js
// (NUEVO) Define los endpoints PROTEGIDOS para la gestión de citas y sesiones clínicas.

const { Router } = require('express');
const {
    createAppointmentRequest,
    getAppointments,
    updateAppointmentStatus,
    startClinicalSession
} = require('../controllers/appointment.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Rutas Protegidas (Requieren autenticación de usuario general) ---

// Permite a un dueño de mascota crear una nueva solicitud de cita.
router.post('/appointments/request', createAppointmentRequest);

// Obtiene las citas para el usuario logueado (sea dueño o veterinario).
router.get('/appointments', getAppointments);

// --- Rutas Protegidas (Requieren que el usuario sea un veterinario verificado) ---

// Permite a un veterinario confirmar o cancelar una cita.
// Se aplica el middleware isVetVerified directamente en la ruta.
router.put('/appointments/:appointmentId/status', isVetVerified, updateAppointmentStatus);

// Permite a un veterinario iniciar una sesión clínica.
router.post('/appointments/:appointmentId/start-session', isVetVerified, startClinicalSession);


module.exports = router;