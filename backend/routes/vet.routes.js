// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.

const { Router } = require('express');
const { findPetByEPID, requestPatientLink, getLinkedPatients } = require('../controllers/vet.controller'); // <-- 1. Importamos la nueva función
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Middleware de Verificación de Veterinario ---
router.use(isVetVerified);

// --- Rutas del Módulo de Veterinarios ---

// URL: /api/vet/find-pet/:epid
// Método: GET
// Función: Permite a un veterinario buscar el perfil de una mascota por su EnlaPet ID.
router.get('/vet/find-pet/:epid', findPetByEPID);

// URL: /api/vet/request-link/:petId
// Método: POST
// Función: Permite a un veterinario enviar una solicitud de vínculo a una mascota.
router.post('/vet/request-link/:petId', requestPatientLink);

// URL: /api/vet/patients
// Método: GET
// Función: Obtiene una lista de todas las mascotas vinculadas activamente con el veterinario.
router.get('/vet/patients', getLinkedPatients); // <-- 2. Añadimos la nueva ruta

module.exports = router;