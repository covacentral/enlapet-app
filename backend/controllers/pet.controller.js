// backend/controllers/pet.controller.js
// Versión 2.4 - Añade la lógica para obtener las misiones completadas de una mascota.

const { db, bucket } = require('../config/firebase');
const admin = require('firebase-admin');
const { getNewPetProfile } = require('../models/pet.model');

/**
 * Obtiene el perfil público de una mascota y los datos de contacto de su responsable.
 */
const getPetPublicProfile = async (req, res) => {
    try {
        const { petId } = req.params;
        const petDoc = await db.collection('pets').doc(petId).get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }

        const petData = petDoc.data();
        const userDoc = await db.collection('users').doc(petData.ownerId).get();

        let ownerData = {
            id: petData.ownerId,
            name: 'Responsable',
            phone: 'No disponible'
        };

        if (userDoc.exists) {
            const fullOwnerData = userDoc.data();
            ownerData = {
                id: petData.ownerId,
                name: fullOwnerData.name,
                phone: fullOwnerData.phone || 'No proporcionado'
            };
        }

        if (petData.rescueMode?.isActive && !petData.rescueMode?.showContactPhone) {
            ownerData.phone = 'Contacto no autorizado por el dueño.';
        }

        const publicProfile = {
            pet: { ...petData, id: petDoc.id },
            owner: ownerData
        };
        res.status(200).json(publicProfile);
    } catch (error) {
        console.error(`Error en getPetPublicProfile para petId ${req.params.petId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Obtiene la lista de mascotas del usuario autenticado.
 */
const getMyPets = async (req, res) => {
    try {
        const { uid } = req.user;
        const petsSnapshot = await db.collection('pets').where('ownerId', '==', uid).get();
        const petsList = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(petsList);
    } catch (error) {
        console.error('Error en getMyPets:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Registra una nueva mascota para el usuario autenticado.
 */
const createPet = async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, breed } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'El nombre es requerido.' });
        }

        const newPetData = getNewPetProfile(uid, name, breed || '');

        const petRef = await db.collection('pets').add(newPetData);
        res.status(201).json({ message: 'Mascota registrada.', petId: petRef.id, epid: newPetData.epid });
    } catch (error) {
        console.error('Error en createPet:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Actualiza los datos de una mascota específica.
 */
const updatePet = async (req, res) => {
    const { uid } = req.user;
    const { petId } = req.params;
    const updateData = req.body;

    try {
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
        }

        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }
        if (petDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
        }

        await petRef.set(updateData, { merge: true });

        if (updateData.location && updateData.location.city) {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (!userData.location || !userData.location.city) {
                    await userRef.set({ location: updateData.location }, { merge: true });
                }
            }
        }

        res.status(200).json({ message: 'Mascota actualizada con éxito.' });
    } catch (error) {
        console.error(`Error en updatePet para petId ${petId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Sube o actualiza la foto de perfil de una mascota.
 */
const uploadPetPicture = async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No se subió ningún archivo.' });
        }

        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }
        if (petDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
        }

        const filePath = `pets-pictures/${petId}/${Date.now()}-${req.file.originalname}`;
        const fileUpload = bucket.file(filePath);
        const blobStream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype } });

        blobStream.on('error', (error) => {
            console.error("Error en blobStream (mascota):", error);
            res.status(500).json({ message: 'Error durante la subida del archivo.' });
        });

        blobStream.on('finish', async () => {
            try {
                await fileUpload.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                await petRef.update({ petPictureUrl: publicUrl });
                res.status(200).json({ message: 'Foto de mascota actualizada.', petPictureUrl: publicUrl });
            } catch (finishError) {
                console.error("Error al finalizar subida de foto de mascota:", finishError);
                res.status(500).json({ message: 'Error al procesar el archivo después de subirlo.' });
            }
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.error('Error en uploadPetPicture:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Permite al dueño de una mascota gestionar una solicitud de vínculo de un veterinario.
 */
const managePatientLink = async (req, res) => {
    const { uid: ownerId } = req.user;
    const { petId } = req.params;
    const { vetId, action } = req.body;

    if (!vetId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Se requiere un vetId y una acción válida (approve/reject).' });
    }

    const petRef = db.collection('pets').doc(petId);

    try {
        await db.runTransaction(async (transaction) => {
            const petDoc = await transaction.get(petRef);
            if (!petDoc.exists) throw new Error('Mascota no encontrada.');

            const petData = petDoc.data();
            if (petData.ownerId !== ownerId) {
                throw new Error('No estás autorizado para gestionar esta mascota.');
            }

            const linkedVets = petData.linkedVets || [];
            const linkIndex = linkedVets.findIndex(link => link.vetId === vetId && link.status === 'pending');

            if (linkIndex === -1) {
                throw new Error('No se encontró una solicitud de vínculo pendiente de este veterinario.');
            }

            const updatePayload = {};

            if (action === 'approve') {
                linkedVets[linkIndex].status = 'active';
                updatePayload.activeVetIds = admin.firestore.FieldValue.arrayUnion(vetId);
            } else { // 'reject'
                linkedVets.splice(linkIndex, 1);
                updatePayload.activeVetIds = admin.firestore.FieldValue.arrayRemove(vetId);
            }

            updatePayload.linkedVets = linkedVets;
            transaction.update(petRef, updatePayload);
        });

        res.status(200).json({ message: `Solicitud de vínculo ${action === 'approve' ? 'aprobada' : 'rechazada'} con éxito.` });
    } catch (error) {
        console.error('Error en managePatientLink:', error);
        res.status(400).json({ message: error.message || 'No se pudo procesar la solicitud.' });
    }
};

/**
 * Gestiona el estado de "modo rescate" de una mascota.
 */
const manageRescueMode = async (req, res) => {
    const { uid: ownerId } = req.user;
    const { petId } = req.params;
    const { isActive, lastSeen, message, showContactPhone } = req.body;

    const petRef = db.collection('pets').doc(petId);

    try {
        const petDoc = await petRef.get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }
        if (petDoc.data().ownerId !== ownerId) {
            return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
        }

        const updatePayload = {};

        if (isActive) {
            if (!lastSeen || !lastSeen.latitude || !lastSeen.longitude) {
                return res.status(400).json({ message: 'Se requieren las coordenadas del último avistamiento.' });
            }
            updatePayload['rescueMode.isActive'] = true;
            updatePayload['rescueMode.activatedAt'] = new Date().toISOString();
            updatePayload['rescueMode.lastSeen.coordinates'] = new admin.firestore.GeoPoint(parseFloat(lastSeen.latitude), parseFloat(lastSeen.longitude));
            updatePayload['rescueMode.lastSeen.address'] = lastSeen.address || '';
            updatePayload['rescueMode.message'] = message || '';
            updatePayload['rescueMode.showContactPhone'] = typeof showContactPhone === 'boolean' ? showContactPhone : true;
        } else {
            updatePayload['rescueMode.isActive'] = false;
            updatePayload['rescueMode.activatedAt'] = null;
        }

        await petRef.update(updatePayload);

        const statusMessage = isActive ? 'activado' : 'desactivado';
        res.status(200).json({ message: `Modo rescate ${statusMessage} con éxito.` });

    } catch (error) {
        console.error('Error en manageRescueMode:', error);
        res.status(500).json({ message: 'Error interno al gestionar el modo rescate.' });
    }
};

// --- [NUEVA FUNCIÓN] ---
/**
 * Obtiene el historial de misiones completadas (hitos) para una mascota.
 */
const getCompletedMissions = async (req, res) => {
    const { petId } = req.params;
    const { uid } = req.user;

    try {
        // Validación de propiedad: Asegurarse de que el usuario que solicita es el dueño.
        const petDoc = await db.collection('pets').doc(petId).get();
        if (!petDoc.exists || petDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para ver esta información.' });
        }

        // 1. Obtener los IDs de las misiones completadas desde la subcolección.
        const completedSnapshot = await db.collection('pets').doc(petId).collection('completedMissions').get();
        if (completedSnapshot.empty) {
            return res.status(200).json([]);
        }
        const missionIds = completedSnapshot.docs.map(doc => doc.id);

        // 2. Obtener los detalles completos de esas misiones desde la colección principal 'missions'.
        const missionsRef = db.collection('missions');
        const missionsSnapshot = await missionsRef.where(admin.firestore.FieldPath.documentId(), 'in', missionIds).get();
        
        const missionsData = missionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.status(200).json(missionsData);

    } catch (error) {
        console.error(`Error en getCompletedMissions para petId ${petId}:`, error);
        res.status(500).json({ message: 'Error interno al obtener el historial de misiones.' });
    }
};


module.exports = {
    getPetPublicProfile,
    getMyPets,
    createPet,
    updatePet,
    uploadPetPicture,
    managePatientLink,
    manageRescueMode,
    getCompletedMissions // <-- Exportamos la nueva función
};