// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.

const { Router } = require('express');
// 1. Importamos la nueva función del controlador
const { 
    findPetByEPID, 
    requestPatientLink, 
    getLinkedPatients, 
    updateAvailability,
    getAvailability
} = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Middleware de Verificación de Veterinario ---
router.use(isVetVerified);

// --- Rutas del Módulo de Veterinarios ---

router.get('/vet/find-pet/:epid', findPetByEPID);
router.post('/vet/request-link/:petId', requestPatientLink);
router.get('/vet/my-patients', getLinkedPatients);

// --- Rutas para la gestión de la agenda ---
router.post('/vet/availability', updateAvailability);

// --- 2. [NUEVO] Ruta para obtener el horario guardado ---
router.get('/vet/availability', getAvailability);


module.exports = router;