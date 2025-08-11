// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.
// Versión Corregida: Middleware aplicado a cada ruta para evitar conflictos.

const { Router } = require('express');
const { 
    findPetByEPID, 
    requestPatientLink, 
    getLinkedPatients, 
    updateAvailability,
    getAvailability,
    getPatientDetails,       // <-- 1. Importamos las nuevas funciones
    addHealthRecordEntry
} = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Rutas del Módulo de Veterinarios (cada una protegida individualmente) ---

router.get('/vet/find-pet/:epid', isVetVerified, findPetByEPID);
router.post('/vet/request-link/:petId', isVetVerified, requestPatientLink);
router.get('/vet/my-patients', isVetVerified, getLinkedPatients);

// --- Rutas para la gestión de la agenda ---
router.post('/vet/availability', isVetVerified, updateAvailability);
router.get('/vet/availability', isVetVerified, getAvailability);

// --- 2. [NUEVAS] Rutas para la gestión de pacientes ---

// URL: /api/vet/patient/:petId
// Método: GET
// Función: Obtiene los detalles completos de un paciente vinculado.
router.get('/vet/patient/:petId', isVetVerified, getPatientDetails);

// URL: /api/vet/patient/:petId/health-record
// Método: POST
// Función: Añade un nuevo registro al carné de salud de un paciente.
router.post('/vet/patient/:petId/health-record', isVetVerified, addHealthRecordEntry);


module.exports = router;