// backend/services/notification.service.js
// Servicio dedicado para la creación de notificaciones enriquecidas.

const { db } = require('../config/firebase');

/**
 * Crea y guarda una notificación enriquecida en Firestore.
 * @param {string} recipientId - UID del usuario que recibirá la notificación.
 * @param {string} actorId - UID del usuario que realizó la acción.
 * @param {('new_follower'|'new_like'|'new_comment')} type - El tipo de notificación.
 * @param {string|null} entityId - El ID de la entidad relacionada (ej. post ID).
 * @param {string|null} entityType - El tipo de la entidad (ej. 'post').
 */
const createNotification = async (recipientId, actorId, type, entityId = null, entityType = null) => {
    if (recipientId === actorId) return;

    try {
        const actorDoc = await db.collection('users').doc(actorId).get();
        if (!actorDoc.exists) {
            console.warn(`Actor con ID ${actorId} no fue encontrado.`);
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
            entityContext: {} // Objeto para guardar datos contextuales.
        };

        // --- LÓGICA DE ENRIQUECIMIENTO ---
        // Si la notificación es sobre un post, buscamos sus detalles.
        if (entityType === 'post' && entityId) {
            const postDoc = await db.collection('posts').doc(entityId).get();
            if (postDoc.exists) {
                const postData = postDoc.data();
                // Añadimos un fragmento del texto del post.
                notification.entityContext.preview = postData.caption ? postData.caption.substring(0, 70) : '';

                // Buscamos el nombre del autor del post (que puede ser usuario o mascota).
                const authorCollection = postData.authorType === 'pet' ? 'pets' : 'users';
                const authorDoc = await db.collection(authorCollection).doc(postData.authorId).get();
                if (authorDoc.exists) {
                    notification.entityContext.authorName = authorDoc.data().name;
                }
            }
        }

        await db.collection('notifications').add(notification);
    } catch (error) {
        console.error('Error al crear la notificación enriquecida:', error);
    }
};

module.exports = {
    createNotification
};