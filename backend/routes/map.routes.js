// backend/routes/map.routes.js

const express = require('express');
const router = express.Router();
const {
  getLocations,
  addLocation
} = require('../controllers/map.controller'); // Importaremos el controlador del mapa
const { protect } = require('../middlewares/auth.middleware'); // Reutilizamos nuestro guardián

// --- Definición de Rutas del Mapa Comunitario ---

// Ruta para obtener todas las ubicaciones aprobadas (Ruta Pública)
// GET /api/locations
router.get('/locations', getLocations);

// Ruta para que un usuario sugiera una nueva ubicación (Ruta Privada)
// POST /api/locations
router.post('/locations', protect, addLocation);

module.exports = router;
