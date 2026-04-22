// backend/controllers/pet.controller.js
// VERSIÓN 3.1: CORREGIDO. Asegura que las fotos de mascotas subidas sean públicas.

const { db, bucket } = require('../config/firebase');
const admin = require('firebase-admin');
const petService = require('../services/pet.service');
const NodeCache = require('node-cache');

const petCache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Memoria de 1 minuto para evitar re-render loops del front


// --- FUNCIONES REFACTORIZADAS (Usan pet.service.js) ---

const getMyPets = async (req, res) => {
    try {
        const { uid } = req.user;
        const cacheKey = `my_pets_${uid}`;
        let pets = petCache.get(cacheKey);
        
        if (!pets) {
            pets = await petService.findPetsByOwnerId(uid);
            petCache.set(cacheKey, pets);
        }
        
        res.status(200).json(pets);
    } catch (error) {
        console.error('Error en getMyPets:', error);
        res.status(500).json({ message: 'Error interno al obtener las mascotas.' });
    }
};

const createPet = async (req, res) => {
    try {
        const { uid } = req.user;
        const { name, breed } = req.body;
        const newPet = await petService.createPetProfile(uid, name, breed);
        
        petCache.del(`my_pets_${uid}`); // Invalida el caché
        
        res.status(201).json({ message: 'Mascota registrada con éxito.', ...newPet });
    } catch (error) {
        console.error('Error en createPet:', error);
        res.status(500).json({ message: 'Error interno al crear la mascota.' });
    }
};

const updatePet = async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;
        const updateData = req.body;
        await petService.updatePetDetails(uid, petId, updateData);
        
        petCache.del(`my_pets_${uid}`); // Invalida el caché
        
        res.status(200).json({ message: 'Perfil de la mascota actualizado con éxito.' });
    } catch (error) {
        console.error(`Error en updatePet para petId ${req.params.petId}:`, error);
        if (error.message === 'Mascota no encontrada.') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'No autorizado para modificar esta mascota.') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al actualizar la mascota.' });
    }
};

const getCompletedMissions = async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;
        const missionsData = await petService.getCompletedMissionsForPet(uid, petId);
        res.status(200).json(missionsData);
    } catch (error) {
        console.error(`Error en getCompletedMissions para petId ${req.params.petId}:`, error);
        if (error.message.startsWith('No autorizado')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno al obtener el historial de misiones.' });
    }
};


// --- FUNCIONES NO REFACTORIZADAS (Mantienen lógica original) ---

const getPetPublicProfile = async (req, res) => {
    try {
        const { petId } = req.params;
        const petDoc = await db.collection('pets').doc(petId).get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Mascota no encontrada.' });
        }

        const petData = petDoc.data();
        const userDoc = await db.collection('users').doc(petData.ownerId).get();

        let ownerData = { id: petData.ownerId, name: 'Responsable', phone: 'No disponible' };

        if (userDoc.exists) {
            const fullOwnerData = userDoc.data();
            ownerData = {
                id: petData.ownerId,
                name: fullOwnerData.name,
                phone: fullOwnerData.phone || 'No proporcionado'
            };
        }

        if (petData.rescueMode?.isActive && !petData.rescueMode?.showContactPhone) {
            ownerData.phone = 'Contacto Oculto por el Dueño';
        }

        res.status(200).json({ pet: petData, owner: ownerData });

    } catch (error) {
        console.error(`Error en getPetPublicProfile para petId ${req.params.petId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

const uploadPetPicture = async (req, res) => {
    try {
        const { uid } = req.user;
        const { petId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No se proporcionó ningún archivo.' });
        }

        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();

        if (!petDoc.exists || petDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: 'No autorizado para modificar esta mascota.' });
        }

        const fileName = `pets-pictures/${petId}/${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: { contentType: file.mimetype }
        });

        blobStream.on('error', (error) => {
            console.error(error);
            res.status(500).json({ message: 'Error al subir la imagen.' });
        });

        blobStream.on('finish', async () => {
            await fileUpload.makePublic();

            // =================================================================
            // INICIO DEL CAMBIO: Construir la nueva URL optimizada
            // =================================================================
            const originalPath = fileName;
            const lastDotIndex = originalPath.lastIndexOf('.');
            const pathWithoutExt = originalPath.substring(0, lastDotIndex);
            
            // Usamos el sufijo exacto de la extensión (1080x1080 y .webp)
            const resizedFilePath = `${pathWithoutExt}_1080x1080.webp`;
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${resizedFilePath}`;
            // =================================================================
            // FIN DEL CAMBIO
            // =================================================================

            await petRef.update({ petPictureUrl: publicUrl });
            petCache.del(`my_pets_${uid}`); // Invalida el caché de las mascotas del dueño
            res.status(200).json({ message: 'Foto de perfil actualizada con éxito.', petPictureUrl: publicUrl });
        });

        blobStream.end(file.buffer);
    } catch (error) {
        console.error(`Error en uploadPetPicture para petId ${req.params.petId}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


const managePatientLink = async (req, res) => {
    try {
        const { petId } = req.params;
        // Se corrige la obtención del vetId. No siempre será el usuario actual.
        const { action, vetId: vetIdFromRequest } = req.body; 
        const requesterId = req.user.uid;

        const petRef = db.collection('pets').doc(petId);

        await db.runTransaction(async (transaction) => {
            const petDoc = await transaction.get(petRef);
            if (!petDoc.exists) {
                throw new Error('Mascota no encontrada.');
            }
            const petData = petDoc.data();
            
            if (action === 'request') {
                // Si la acción es 'request', el solicitante es el veterinario.
                const vetId = requesterId;
                const vetLinkIndex = petData.linkedVets.findIndex(v => v.vetId === vetId);
                if (vetLinkIndex !== -1) {
                    throw new Error('Ya existe una solicitud para esta mascota.');
                }
                const newLink = { vetId, linkedAt: new Date().toISOString(), status: 'pending' };
                transaction.update(petRef, { linkedVets: admin.firestore.FieldValue.arrayUnion(newLink) });

            } else if ((action === 'approve' || action === 'reject') && petData.ownerId === requesterId) {
                // Si la acción es 'approve' o 'reject', el solicitante debe ser el dueño.
                // El vetId debe venir en el cuerpo de la solicitud.
                const vetId = vetIdFromRequest;
                if (!vetId) {
                    throw new Error('No se proporcionó el ID del veterinario.');
                }
                const vetLinkIndex = petData.linkedVets.findIndex(v => v.vetId === vetId);
                if (vetLinkIndex === -1) {
                    throw new Error('No se encontró la solicitud de vínculo.');
                }

                const updatedVets = [...petData.linkedVets];
                
                if (action === 'approve') {
                    updatedVets[vetLinkIndex].status = 'active';
                    transaction.update(petRef, {
                        linkedVets: updatedVets,
                        activeVetIds: admin.firestore.FieldValue.arrayUnion(vetId)
                    });
                } else { // action === 'reject'
                    updatedVets[vetLinkIndex].status = 'revoked'; // O 'rejected'
                    transaction.update(petRef, {
                        linkedVets: updatedVets,
                        activeVetIds: admin.firestore.FieldValue.arrayRemove(vetId)
                    });
                }
            } else {
                throw new Error('Acción no válida o no autorizada.');
            }
        });
        res.status(200).json({ message: `Vínculo de paciente gestionado con éxito para la acción: ${action}.` });
    } catch (error) {
        console.error('Error en managePatientLink:', error);
        res.status(500).json({ message: error.message || 'Error interno al gestionar el vínculo.' });
    }
};

const manageRescueMode = async (req, res) => {
    const { petId } = req.params;
    const { uid } = req.user;
    const { isActive, lastSeen, message, showContactPhone } = req.body;

    try {
        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();

        if (!petDoc.exists) {
            return res.status(404).json({ message: "Mascota no encontrada." });
        }

        if (petDoc.data().ownerId !== uid) {
            return res.status(403).json({ message: "No autorizado para modificar esta mascota." });
        }

        const updatePayload = {
            'rescueMode.isActive': isActive,
            'rescueMode.activatedAt': isActive ? new Date().toISOString() : null,
            'rescueMode.message': message || '',
            'rescueMode.showContactPhone': showContactPhone === true,
        };

        if (lastSeen) {
            updatePayload['rescueMode.lastSeen'] = lastSeen;
        }

        await petRef.update(updatePayload);
        res.status(200).json({ message: `Modo rescate ${isActive ? 'activado' : 'desactivado'} con éxito.` });

    } catch (error) {
        console.error("Error en manageRescueMode:", error);
        res.status(500).json({ message: "Error interno del servidor al gestionar el modo rescate." });
    }
};


module.exports = {
    getMyPets,
    createPet,
    updatePet,
    getCompletedMissions,
    getPetPublicProfile,
    uploadPetPicture,
    managePatientLink,
    manageRescueMode,
};