// backend/controllers/notification.controller.js

const { db } = require('../config/firebase');

// --- Controlador para obtener las notificaciones del usuario ---
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Buscamos en la colección 'notifications' todos los documentos
    // que pertenezcan al usuario y los ordenamos por fecha, los más recientes primero.
    const notificationsSnapshot = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(30) // Limitamos a las 30 notificaciones más recientes
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    res.status(500).json({ message: 'Error del servidor al obtener las notificaciones.' });
  }
};

// --- Controlador para marcar notificaciones como leídas ---
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.uid;

    // 1. Encontrar todas las notificaciones no leídas del usuario.
    const unreadNotificationsSnapshot = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .where('read', '==', false)
      .get();
      
    if (unreadNotificationsSnapshot.empty) {
        return res.status(200).json({ message: 'No hay notificaciones nuevas para marcar como leídas.' });
    }

    // 2. Usar un "batch write" para actualizar todas las notificaciones encontradas
    // en una sola operación atómica. Es mucho más eficiente que actualizarlas una por una.
    const batch = db.batch();
    unreadNotificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    // 3. Ejecutar el batch.
    await batch.commit();

    res.status(200).json({ message: 'Notificaciones marcadas como leídas.' });
  } catch (error) {
    console.error('Error al marcar las notificaciones como leídas:', error);
    res.status(500).json({ message: 'Error del servidor al actualizar las notificaciones.' });
  }
};

module.exports = {
  getNotifications,
  markNotificationsAsRead,
};
