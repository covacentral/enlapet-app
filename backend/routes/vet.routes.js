// backend/routes/vet.routes.js
// Define los endpoints PROTEGIDOS exclusivos para usuarios verificados como veterinarios.

const { Router } = require('express');
// 1. Importamos la nueva función del controlador
const { findPetByEPID, requestPatientLink, getLinkedPatients } = require('../controllers/vet.controller');
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

// --- 2. [NUEVO] Ruta para obtener los pacientes vinculados ---
// URL: /api/vet/my-patients
// Método: GET
// Función: Devuelve una lista de todas las mascotas activamente vinculadas al veterinario.
router.get('/vet/my-patients', getLinkedPatients);


module.exports = router;