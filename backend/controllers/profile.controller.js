// backend/controllers/profile.controller.js
// Lógica de negocio para perfiles de usuario y sistema de seguimiento (Versión Corregida).

const { db, bucket } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

/**
 * Obtiene el perfil público de un usuario, incluyendo sus mascotas.
 */
const getUserPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();
        
        const publicProfile = {
            id: userDoc.id,
            name: userData.name,
            profilePictureUrl: userData.profilePictureUrl || '',
            bio: userData.bio || '',
            followersCount: userData.followersCount || 0,
            followingCount: userData.followingCount || 0,
            // --- LÍNEA CORREGIDA ---
            // Añadimos el objeto de verificación a la respuesta pública.
            verification: userData.verification || { status: 'none', type: 'none' },
        };

        const petsSnapshot = await db.collection('pets').where('ownerId', '==', userId).get();
        const pets = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ profile: publicProfile, pets });
    } catch (error) {
        console.error('Error al obtener el perfil público del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Actualiza el perfil del usuario autenticado.
 */
const updateUserProfile = async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, bio, phone, address } = req.body;
        const userRef = db.collection('users').doc(uid);
        
        const updateData = {};
        if (name) updateData.name = name;
        if (bio) updateData.bio = bio;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        await userRef.update(updateData);
        res.status(200).json({ message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        res.status(500).json({ message: 'Error interno al actualizar el perfil.' });
    }
};

/**
 * Sube o actualiza la foto de perfil del usuario.
 */
const uploadProfilePicture = async (req, res) => {
    try {
        const { uid } = req.user;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No se proporcionó ningún archivo.' });
        }

        const fileName = `profile-pictures/${uid}/${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype }
        });

        blobStream.on('error', (error) => {
            console.error(error);
            res.status(500).json({ message: 'Error al subir la imagen.' });
        });

        blobStream.on('finish', async () => {
            // **INICIO DE LA CORRECCIÓN**
            try {
                await fileUpload.makePublic();
            } catch (error) {
                console.error('Error al hacer pública la imagen:', error);
                return res.status(500).json({ message: 'La imagen se subió pero no se pudo hacer pública.' });
            }
            // **FIN DE LA CORRECCIÓN**

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            await db.collection('users').doc(uid).update({ profilePictureUrl: publicUrl });
            res.status(200).json({ message: 'Foto de perfil actualizada con éxito.', profilePictureUrl: publicUrl });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error('Error al subir la foto de perfil:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


/**
 * Permite a un usuario seguir a otro.
 */
const followProfile = async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;

    if (uid === profileId) {
        return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
    }

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection('users').doc(profileId);

    try {
        await db.runTransaction(async (t) => {
            const followedDoc = await t.get(followedProfileRef);
            if (!followedDoc.exists) {
                throw new Error('El perfil que intentas seguir no existe.');
            }

            const followingRef = currentUserRef.collection('following').doc(profileId);
            const followerRef = followedProfileRef.collection('followers').doc(uid);

            t.set(followingRef, { followedAt: new Date() });
            t.update(currentUserRef, { followingCount: admin.firestore.FieldValue.increment(1) });
            t.set(followerRef, { followerAt: new Date() });
            t.update(followedProfileRef, { followersCount: admin.firestore.FieldValue.increment(1) });
        });
        
        // Crear notificación para el usuario seguido
        await createNotification(profileId, 'new_follower', `Comenzó a seguirte.`, uid);

        res.status(200).json({ message: 'Ahora sigues a este perfil.' });
    } catch (error) {
        console.error('Error al seguir al perfil:', error);
        res.status(500).json({ message: error.message || 'No se pudo completar la acción.' });
    }
};

/**
 * Permite a un usuario dejar de seguir a otro.
 */
const unfollowProfile = async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection('users').doc(profileId);

    try {
        await db.runTransaction(async (t) => {
            t.delete(currentUserRef.collection('following').doc(profileId));
            t.update(currentUserRef, { followingCount: admin.firestore.FieldValue.increment(-1) });
            t.delete(followedProfileRef.collection('followers').doc(uid));
            t.update(followedProfileRef, { followersCount: admin.firestore.FieldValue.increment(-1) });
        });
        res.status(200).json({ message: 'Has dejado de seguir a este perfil.' });
    } catch (error) {
        console.error('Error al dejar de seguir al perfil:', error);
        res.status(500).json({ message: 'No se pudo completar la acción.' });
    }
};

/**
 * Verifica si el usuario actual sigue a un perfil específico.
 */
const getFollowStatus = async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    try {
        const followDoc = await db.collection('users').doc(uid).collection('following').doc(profileId).get();
        res.status(200).json({ isFollowing: followDoc.exists });
    } catch (error) {
        console.error('Error al verificar el estado de seguimiento:', error);
        res.status(500).json({ message: 'No se pudo verificar el estado de seguimiento.' });
    }
};

module.exports = {
    getUserPublicProfile,
    updateUserProfile,
    uploadProfilePicture,
    followProfile,
    unfollowProfile,
    getFollowStatus
};