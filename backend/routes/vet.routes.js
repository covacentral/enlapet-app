// backend/routes/vet.routes.js
// Versión 2.0 - Rutas para la gestión del ECD
// TAREA: Se añaden los nuevos endpoints para el Expediente Clínico Digital.

const { Router } = require('express');
const { 
    findPetByEPID, 
    requestPatientLink, 
    getLinkedPatients,
    addHealthRecordEntry,   // <-- 1. Importamos las nuevas funciones
    updatePatientStatus 
} = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Middleware de Verificación de Veterinario ---
// Este middleware protege TODAS las rutas definidas en este archivo.
router.use(isVetVerified);

// --- Rutas del Módulo de Veterinarios ---

// Búsqueda y Vínculo de Pacientes
router.get('/vet/find-pet/:epid', findPetByEPID);
router.post('/vet/request-link/:petId', requestPatientLink);

// Gestión de Pacientes y su ECD
router.get('/vet/patients', getLinkedPatients);
router.put('/vet/patients/:petId/status', updatePatientStatus); // <-- 2. Nueva ruta para actualizar estado
router.post('/vet/patients/:petId/health-record', addHealthRecordEntry); // <-- 3. Nueva ruta para añadir registros al ECD

module.exports = router;