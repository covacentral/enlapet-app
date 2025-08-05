// backend/controllers/pet.controller.js
// Lógica de negocio para la gestión de perfiles de mascotas.

const { db, bucket } = require('../config/firebase');
const admin = require('firebase-admin');
const { getNewPetProfile } = require('../models/pet.model'); // <-- 1. IMPORTAMOS el nuevo modelo de mascota

/**
 * Obtiene el perfil público de una mascota y los datos de contacto de su responsable.
 */
const getPetPublicProfile = async (req, res) => {
    // ... (sin cambios en esta función)
};

/**
 * Obtiene la lista de mascotas del usuario autenticado.
 */
const getMyPets = async (req, res) => {
    // ... (sin cambios en esta función)
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

        // <-- 2. UTILIZAMOS el modelo para crear la nueva mascota
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
    // ... (sin cambios en esta función, pero la revisaremos más adelante para permisos de edición del veterinario)
};

/**
 * Sube o actualiza la foto de perfil de una mascota.
 */
const uploadPetPicture = async (req, res) => {
    // ... (sin cambios en esta función)
};


/**
 * [NUEVO] Permite al dueño de una mascota gestionar una solicitud de vínculo de un veterinario.
 */
const managePatientLink = async (req, res) => {
    const { uid: ownerId } = req.user;
    const { petId } = req.params;
    const { vetId, action } = req.body; // action puede ser 'approve' o 'reject'

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

            if (action === 'approve') {
                linkedVets[linkIndex].status = 'active';
                // Aquí se podría notificar al veterinario que su solicitud fue aceptada.
            } else { // 'reject'
                // En lugar de borrarla, marcamos el vínculo como revocado o la eliminamos.
                // Por simplicidad, la eliminaremos. En una versión futura podría guardarse el historial.
                linkedVets.splice(linkIndex, 1);
            }

            transaction.update(petRef, { linkedVets });
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
    managePatientLink // <-- 3. EXPORTAMOS la nueva función
};