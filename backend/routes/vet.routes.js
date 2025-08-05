// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.

const { Router } = require('express');
const { findPetByEPID, requestPatientLink } = require('../controllers/vet.controller');
const isVetVerified = require('../middleware/isVetVerified');

const router = Router();

// --- Middleware de Verificación de Veterinario ---
// Todas las rutas definidas en este archivo requerirán que el usuario
// sea un veterinario verificado.
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

module.exports = router;