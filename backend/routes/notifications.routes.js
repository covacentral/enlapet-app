// backend/routes/notifications.routes.js
// Define los endpoints para la gestión de notificaciones.

const { Router } = require('express');
const {
    getNotifications,
    getUnreadCount,
    markNotificationsAsRead
} = require('../controllers/notification.controller');

const router = Router();

// Todas las rutas en este archivo están protegidas y requieren autenticación.

// URL: /api/notifications
// Método: GET
// Función: Obtiene las notificaciones más recientes del usuario.
router.get('/notifications', getNotifications);

// URL: /api/notifications/unread-count
// Método: GET
// Función: Obtiene el número de notificaciones no leídas.
router.get('/notifications/unread-count', getUnreadCount);

// URL: /api/notifications/mark-as-read
// Método: POST
// Función: Marca todas las notificaciones del usuario como leídas.
router.post('/notifications/mark-as-read', markNotificationsAsRead);

module.exports = router;