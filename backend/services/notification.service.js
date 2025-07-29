// backend/services/notification.service.js
// Servicio dedicado para la creación de notificaciones.

const { db } = require('../config/firebase');

/**
 * Crea y guarda una notificación en Firestore.
 * @param {string} recipientId - UID del usuario que recibirá la notificación.
 * @param {string} actorId - UID del usuario que realizó la acción.
 * @param {('new_follower'|'new_like'|'new_comment')} type - El tipo de notificación.
 * @param {string|null} entityId - El ID de la entidad relacionada (ej. post ID).
 * @param {string|null} entityType - El tipo de la entidad (ej. 'post').
 */
const createNotification = async (recipientId, actorId, type, entityId = null, entityType = null) => {
    // Evita la auto-notificación.
    if (recipientId === actorId) {
        console.log(`Notificación omitida: El actor y el recipiente son el mismo usuario (${actorId}).`);
        return;
    }

    try {
        // Obtenemos el perfil del actor para obtener su nombre y foto.
        const actorDoc = await db.collection('users').doc(actorId).get();
        if (!actorDoc.exists) {
            console.warn(`No se pudo crear la notificación: El actor con ID ${actorId} no fue encontrado.`);
            return;
        }
        const actorData = actorDoc.data();

        const notification = {
            recipientId,
            actorId,
            actorName: actorData.name,
            actorProfilePic: actorData.profilePictureUrl || '',
            type,
            entityId,
            entityType,
            read: false,
            createdAt: new Date().toISOString(),
        };

        await db.collection('notifications').add(notification);
    } catch (error) {
        console.error('Error al crear la notificación en el servicio:', error);
    }
};

module.exports = {
    createNotification
};