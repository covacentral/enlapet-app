// backend/services/pet.service.js
// Contiene la lógica de negocio para la gestión de mascotas.

const { db, bucket } = require('../config/firebase');
const admin = require('firebase-admin');
const { getNewPetProfile } = require('../models/pet.model');

/**
 * Obtiene las mascotas de un propietario específico.
 * @param {string} ownerId - El UID del propietario.
 * @returns {Promise<Array<Object>>} Un array con los perfiles de las mascotas.
 */
const findPetsByOwnerId = async (ownerId) => {
    const petsSnapshot = await db.collection('pets').where('ownerId', '==', ownerId).get();
    return petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Crea un nuevo perfil de mascota en Firestore.
 * @param {string} ownerId - El UID del propietario.
 * @param {string} name - El nombre de la mascota.
 * @param {string} breed - La raza de la mascota.
 * @returns {Promise<{petId: string, epid: string}>} El ID y EPID de la nueva mascota.
 */
const createPetProfile = async (ownerId, name, breed) => {
    const newPetData = getNewPetProfile(ownerId, name, breed);
    const petRef = await db.collection('pets').add(newPetData);
    return { petId: petRef.id, epid: newPetData.epid };
};

/**
 * Actualiza los datos de una mascota y, si es necesario, la ubicación del propietario.
 * @param {string} ownerId - El UID del propietario que realiza la actualización.
 * @param {string} petId - El ID de la mascota a actualizar.
 * @param {Object} updateData - Los datos a actualizar.
 * @returns {Promise<void>}
 */
const updatePetDetails = async (ownerId, petId, updateData) => {
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
        throw new Error('Mascota no encontrada.');
    }
    if (petDoc.data().ownerId !== ownerId) {
        throw new Error('No autorizado para modificar esta mascota.');
    }

    await petRef.set(updateData, { merge: true });

    // Si se actualiza la ubicación de la mascota, se propaga al dueño si este no tiene una.
    if (updateData.location?.city) {
        const userRef = db.collection('users').doc(ownerId);
        const userDoc = await userRef.get();
        if (userDoc.exists && !userDoc.data().location?.city) {
            await userRef.set({ location: updateData.location }, { merge: true });
        }
    }
};

/**
 * Obtiene el historial de misiones completadas para una mascota.
 * @param {string} ownerId - El UID del propietario.
 * @param {string} petId - El ID de la mascota.
 * @returns {Promise<Array<Object>>} Un array con los datos de las misiones completadas.
 */
const getCompletedMissionsForPet = async (ownerId, petId) => {
    const petDoc = await db.collection('pets').doc(petId).get();
    if (!petDoc.exists || petDoc.data().ownerId !== ownerId) {
        throw new Error('No autorizado para ver esta información.');
    }

    const completedSnapshot = await db.collection('pets').doc(petId).collection('completedMissions').get();
    if (completedSnapshot.empty) {
        return [];
    }

    const missionIds = completedSnapshot.docs.map(doc => doc.id);
    const missionsSnapshot = await db.collection('missions').where(admin.firestore.FieldPath.documentId(), 'in', missionIds).get();
    
    return missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


module.exports = {
    findPetsByOwnerId,
    createPetProfile,
    updatePetDetails,
    getCompletedMissionsForPet,
};