// backend/routes/events.routes.js
// Define los endpoints para la gestión de eventos de la comunidad.

const { Router } = require('express');
const multer = require('multer');
const {
    getEventCategories,
    getEvents,
    getEventDetails,
    createEvent,
    updateEventStatus,
    updateEventDetails
} = require('../controllers/event.controller');

// Configuración de Multer para la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// URL: /api/event-categories
// Método: GET
// Función: Obtiene la lista de categorías de eventos.
router.get('/event-categories', getEventCategories);

// URL: /api/events
// Método: GET
// Función: Obtiene la lista de eventos, con filtros opcionales por estado.
router.get('/events', getEvents);

// URL: /api/events/:eventId
// Método: GET
// Función: Obtiene los detalles de un evento específico.
router.get('/events/:eventId', getEventDetails);

// URL: /api/events
// Método: POST
// Función: Crea un nuevo evento.
router.post('/events', upload.single('coverImage'), createEvent);

// URL: /api/events/:eventId/status
// Método: PUT
// Función: Actualiza el estado de un evento (ej. 'cancelled').
router.put('/events/:eventId/status', updateEventStatus);

// URL: /api/events/:eventId/details
// Método: PUT
// Función: Actualiza los detalles de un evento (si el tiempo lo permite).
router.put('/events/:eventId/details', upload.single('coverImage'), updateEventDetails);

module.exports = router;