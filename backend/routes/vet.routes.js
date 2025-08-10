// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.
// VERSIÓN CORREGIDA: Middleware aplicado a cada ruta para evitar conflictos.

const { Router } = require('express');
const { 
    findPetByEPID, 
    requestPatientLink, 
    getLinkedPatients, 
    updateAvailability,
    getAvailability
} = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- ATENCIÓN: Ya no usamos router.use(isVetVerified) aquí arriba ---

// --- Rutas del Módulo de Veterinarios (cada una protegida individualmente) ---

// URL: /api/vet/find-pet/:epid
// Método: GET
router.get('/vet/find-pet/:epid', isVetVerified, findPetByEPID);

// URL: /api/vet/request-link/:petId
// Método: POST
router.post('/vet/request-link/:petId', isVetVerified, requestPatientLink);

// URL: /api/vet/my-patients
// Método: GET
router.get('/vet/my-patients', isVetVerified, getLinkedPatients);

// --- Rutas para la gestión de la agenda ---
// URL: /api/vet/availability
// Método: POST
router.post('/vet/availability', isVetVerified, updateAvailability);

// URL: /api/vet/availability
// Método: GET
router.get('/vet/availability', isVetVerified, getAvailability);


module.exports = router;