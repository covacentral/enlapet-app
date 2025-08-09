// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.

const { Router } = require('express');
// 1. Importamos la nueva función del controlador
const { 
    findPetByEPID, 
    requestPatientLink, 
    getLinkedPatients, 
    updateAvailability 
} = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Middleware de Verificación de Veterinario ---
// Todas las rutas definidas en este archivo requerirán que el usuario
// sea un veterinario verificado.
router.use(isVetVerified);

// --- Rutas del Módulo de Veterinarios ---

// URL: /api/vet/find-pet/:epid
// Método: GET
router.get('/vet/find-pet/:epid', findPetByEPID);

// URL: /api/vet/request-link/:petId
// Método: POST
router.post('/vet/request-link/:petId', requestPatientLink);

// URL: /api/vet/my-patients
// Método: GET
router.get('/vet/my-patients', getLinkedPatients);

// --- 2. [NUEVO] Ruta para la gestión de la agenda ---
// URL: /api/vet/availability
// Método: POST
// Función: Guarda la plantilla de horario semanal del veterinario.
router.post('/vet/availability', updateAvailability);


module.exports = router;