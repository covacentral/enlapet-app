// backend/controllers/profile.controller.js
// Lógica de negocio para perfiles de usuario y sistema de seguimiento (Versión Corregida).

const { db, bucket } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin'); // <-- LÍNEA CORREGIDA

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
        };

        const petsSnapshot = await db.collection('pets').where('ownerId', '==', userId).get();
        const petsList = petsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            breed: doc.data().breed,
            petPictureUrl: doc.data().petPictureUrl || ''
        }));

        res.status(200).json({ userProfile: publicProfile, pets: petsList });
    } catch (error) {
        console.error(`Error en getUserPublicProfile para userId ${req.params.userId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Obtiene el perfil privado del usuario autenticado.
 */
const getCurrentUserProfile = async (req, res) => {
    try {
        const { uid } = req.user;
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Perfil no encontrado.' });
        }
        res.status(200).json(userDoc.data());
    } catch (error) {
        console.error('Error en getCurrentUserProfile:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Actualiza el perfil del usuario autenticado.
 */
const updateUserProfile = async (req, res) => {
    try {
        const { uid } = req.user;
        const dataToUpdate = req.body;
        
        delete dataToUpdate.uid;
        delete dataToUpdate.email;
        delete dataToUpdate.followersCount;
        delete dataToUpdate.followingCount;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos válidos para actualizar.' });
        }

        await db.collection('users').doc(uid).set(dataToUpdate, { merge: true });
        res.status(200).json({ message: 'Perfil actualizado con éxito.' });
    } catch (error) {
        console.error('Error en updateUserProfile:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Sube o actualiza la foto de perfil del usuario autenticado.
 */
const uploadProfilePicture = async (req, res) => {
    try {
        const { uid } = req.user;
        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const filePath = `profile-pictures/${uid}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', (error) => {
            console.error('Error en blobStream (profile picture):', error);
            res.status(500).json({ message: 'Error durante la subida del archivo.' });
        });

        blobStream.on('finish', async () => {
            try {
                await fileUpload.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                await db.collection('users').doc(uid).update({ profilePictureUrl: publicUrl });
                res.status(200).json({ message: 'Foto actualizada.', profilePictureUrl: publicUrl });
            } catch (finishError) {
                console.error('Error al finalizar la subida de foto de perfil:', finishError);
                res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error en uploadProfilePicture:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Permite a un usuario seguir a otro perfil (usuario o mascota).
 */
const followProfile = async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    const { profileType } = req.body;

    if (uid === profileId) {
        return res.status(400).json({ message: 'No te puedes seguir a ti mismo.' });
    }
    if (!profileType || !['user', 'pet'].includes(profileType)) {
        return res.status(400).json({ message: 'Se requiere un tipo de perfil válido (pet/user).' });
    }

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection(profileType === 'pet' ? 'pets' : 'users').doc(profileId);

    try {
        await db.runTransaction(async (t) => {
            const followedDoc = await t.get(followedProfileRef);
            if (!followedDoc.exists) throw new Error('El perfil que intentas seguir no existe.');

            const recipientId = profileType === 'pet' ? followedDoc.data().ownerId : profileId;

            t.set(currentUserRef.collection('following').doc(profileId), {
                followedAt: new Date().toISOString(),
                type: profileType
            });
            t.update(currentUserRef, { followingCount: admin.firestore.FieldValue.increment(1) });

            t.set(followedProfileRef.collection('followers').doc(uid), {
                followedAt: new Date().toISOString()
            });
            t.update(followedProfileRef, { followersCount: admin.firestore.FieldValue.increment(1) });
            
            await createNotification(recipientId, uid, 'new_follower', profileId, profileType);
        });
        res.status(200).json({ message: 'Ahora estás siguiendo a este perfil.' });
    } catch (error) {
        console.error('Error al seguir al perfil:', error);
        res.status(500).json({ message: 'No se pudo completar la acción de seguir.' });
    }
};

/**
 * Permite a un usuario dejar de seguir a otro perfil.
 */
const unfollowProfile = async (req, res) => {
    const { uid } = req.user;
    const { profileId } = req.params;
    const { profileType } = req.body;

    if (!profileType || !['user', 'pet'].includes(profileType)) {
        return res.status(400).json({ message: 'Se requiere un tipo de perfil válido (pet/user).' });
    }

    const currentUserRef = db.collection('users').doc(uid);
    const followedProfileRef = db.collection(profileType === 'pet' ? 'pets' : 'users').doc(profileId);

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
    getCurrentUserProfile,
    updateUserProfile,
    uploadProfilePicture,
    followProfile,
    unfollowProfile,
    getFollowStatus
};