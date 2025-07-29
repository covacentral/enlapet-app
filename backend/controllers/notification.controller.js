// backend/controllers/notification.controller.js
// Lógica de negocio para la gestión de notificaciones.

const { db } = require('../config/firebase');

/**
 * Obtiene las 30 notificaciones más recientes para el usuario autenticado.
 */
const getNotifications = async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(30)
            .get();
        
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error en getNotifications:', error);
        res.status(500).json({ message: 'Error al obtener notificaciones.' });
    }
};

/**
 * Cuenta el número de notificaciones no leídas para el usuario autenticado.
 */
const getUnreadCount = async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .where('read', '==', false)
            .get();
            
        res.status(200).json({ count: snapshot.size });
    } catch (error) {
        console.error('Error en getUnreadCount:', error);
        res.status(500).json({ message: 'Error al contar notificaciones.' });
    }
};

/**
 * Marca todas las notificaciones no leídas del usuario como leídas.
 */
const markNotificationsAsRead = async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('notifications')
            .where('recipientId', '==', uid)
            .where('read', '==', false)
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ message: 'No hay notificaciones nuevas para marcar.' });
        }

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });
        await batch.commit();

        res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        console.error('Error en markNotificationsAsRead:', error);
        res.status(500).json({ message: 'Error al actualizar notificaciones.' });
    }
};


module.exports = {
    getNotifications,
    getUnreadCount,
    markNotificationsAsRead
};