// backend/routes/events.routes.js
// VERSIÓN 2.0: Añade validación de datos para la creación de eventos.

const { Router } = require('express');
const multer = require('multer');

// --- 1. Importamos middleware y esquema ---
const validateRequest = require('../middleware/validateRequest');
const { createEventSchema } = require('../models/event.model');

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

router.get('/event-categories', getEventCategories);
router.get('/events', getEvents);
router.get('/events/:eventId', getEventDetails);

// --- 2. Aplicamos el middleware de validación a la creación de eventos ---
router.post('/events', upload.single('coverImage'), validateRequest(createEventSchema), createEvent);

router.put('/events/:eventId/status', updateEventStatus);
router.put('/events/:eventId', upload.single('coverImage'), updateEventDetails);

module.exports = router;