// backend/routes/notification.routes.js

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationsAsRead
} = require('../controllers/notification.controller'); // Importaremos el controlador de notificaciones
const { protect } = require('../middlewares/auth.middleware'); // Reutilizamos nuestro guardián

// --- Definición de Rutas de Notificaciones ---

// Ruta para obtener todas las notificaciones del usuario autenticado
// GET /api/notifications
router.get('/notifications', protect, getNotifications);

// Ruta para marcar todas las notificaciones del usuario como leídas
// POST /api/notifications/mark-as-read
router.post('/notifications/mark-as-read', protect, markNotificationsAsRead);

module.exports = router;
