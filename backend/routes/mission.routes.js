// backend/routes/mission.routes.js
// Define los endpoints PROTEGIDOS para la gestión de Misiones EnlaPet.

const { Router } = require('express');
const { getMissions } = require('../controllers/mission.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación por defecto.

// URL: /api/missions?petId=<petId>
// Método: GET
// Función: Obtiene la lista de misiones activas y el estado de completitud para una mascota específica.
router.get('/missions', getMissions);

module.exports = router;