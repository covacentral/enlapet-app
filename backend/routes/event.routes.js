// backend/routes/event.routes.js

const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  createEvent,
  attendEvent
} = require('../controllers/event.controller'); // Importaremos el controlador de eventos
const { protect } = require('../middlewares/auth.middleware'); // Reutilizamos nuestro guardián

// --- Definición de Rutas de Eventos ---

// Ruta para obtener todos los eventos de la comunidad (Ruta Pública)
// GET /api/events
router.get('/events', getAllEvents);

// Ruta para crear un nuevo evento (Ruta Privada)
// POST /api/events
router.post('/events', protect, createEvent);

// Ruta para que un usuario se registre como asistente a un evento (Ruta Privada)
// POST /api/events/:eventId/attend
router.post('/events/:eventId/attend', protect, attendEvent);

module.exports = router;
