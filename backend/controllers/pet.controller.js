// backend/controllers/pet.controller.js
// Versión 2.2 - Optimización de Vínculos Veterinarios
// TAREA: Se añade un campo 'activeVetIds' para consultas eficientes.

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

            // --- LÓGICA MODIFICADA ---
            const updatePayload = {};

            if (action === 'approve') {
                linkedVets[linkIndex].status = 'active';
                // Añadimos el ID del veterinario al nuevo array para búsquedas rápidas
                updatePayload.activeVetIds = admin.firestore.FieldValue.arrayUnion(vetId);
            } else { // 'reject'
                linkedVets.splice(linkIndex, 1);
                 // Nos aseguramos de que no quede en el array de búsqueda si se rechaza
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

module.exports = {
    getPetPublicProfile,
    getMyPets,
    createPet,
    updatePet,
    uploadPetPicture,
    managePatientLink
};