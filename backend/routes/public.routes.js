// backend/routes/public.routes.js
// (NUEVO) Define exclusivamente los endpoints públicos de la API.

const { Router } = require('express');
const { getPetPublicProfile } = require('../controllers/pet.controller');
const { getUserPublicProfile } = require('../controllers/profile.controller');

const router = Router();

// URL: /api/public/pets/:petId
// Método: GET
// Función: Obtiene el perfil público de una mascota para la visualización NFC.
router.get('/public/pets/:petId', getPetPublicProfile);

// URL: /api/public/users/:userId
// Método: GET
// Función: Obtiene el perfil público de cualquier usuario.
router.get('/public/users/:userId', getUserPublicProfile);

module.exports = router;