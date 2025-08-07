// backend/controllers/vet.controller.js
// Versión 3.0 - Lógica de Negocio para el Expediente Clínico Digital (ECD)
// TAREA: Se añaden funciones para gestionar el ECD y se expande la funcionalidad existente.

const { db } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

/**
 * Middleware interno para verificar si un veterinario está activamente vinculado a una mascota.
 * Reutiliza la lógica de autorización en múltiples funciones.
 * @param {string} vetId - UID del veterinario.
 * @param {string} petId - ID de la mascota.
 * @returns {Promise<Object>} El documento de la mascota si está autorizado. Lanza un error si no.
 */
const getPetIfAuthorized = async (vetId, petId) => {
    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
        throw new Error('Mascota no encontrada.');
    }

    const petData = petDoc.data();
    const isLinkedVet = petData.linkedVets && petData.linkedVets[vetId]?.status === 'active';

    if (!isLinkedVet) {
        throw new Error('No autorizado. Se requiere un vínculo activo con esta mascota.');
    }
    
    return petData;
};

/**
 * Verifica si una sesión clínica está activa para una mascota y un veterinario.
 * @param {string} vetId 
 * @param {string} petId 
 * @returns {Promise<boolean>}
 */
const isClinicalSessionActive = async (vetId, petId) => {
    const now = new Date();
    const query = await db.collection('appointments')
        .where('vetId', '==', vetId)
        .where('petId', '==', petId)
        .where('session.isActive', '==', true)
        .where('session.expiresAt', '>', now.toISOString())
        .limit(1)
        .get();

    return !query.empty;
};


/**
 * Busca un perfil de mascota por su EnlaPet ID (EPID).
 */
const findPetByEPID = async (req, res) => {
    const { epid } = req.params;
    if (!epid) {
        return res.status(400).json({ message: 'Se requiere un EnlaPet ID (EPID).' });
    }
    try {
        const petsRef = db.collection('pets');
        const snapshot = await petsRef.where('epid', '==', epid.toUpperCase()).limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({ message: 'No se encontró ninguna mascota con ese EPID.' });
        }
        const petDoc = snapshot.docs[0];
        const petData = petDoc.data();
        const petPreview = {
            id: petDoc.id,
            name: petData.name,
            breed: petData.breed,
            petPictureUrl: petData.petPictureUrl,
            ownerId: petData.ownerId
        };
        res.status(200).json(petPreview);
    } catch (error) {
        console.error('Error en findPetByEPID:', error);
        res.status(500).json({ message: 'Error interno al buscar la mascota.' });
    }
};

/**
 * Permite a un veterinario enviar una solicitud para vincularse a una mascota.
 */
const requestPatientLink = async (req, res) => {
    const { uid: vetId, name: vetName } = req.user;
    const { petId } = req.params;
    const petRef = db.collection('pets').doc(petId);
    try {
        const petDoc = await petRef.get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'La mascota no fue encontrada.' });
        }
        const petData = petDoc.data();
        const linkedVets = petData.linkedVets || {};
        if (linkedVets[vetId] && (linkedVets[vetId].status === 'active' || linkedVets[vetId].status === 'pending')) {
            return res.status(409).json({ message: 'Ya tienes un vínculo activo o una solicitud pendiente con esta mascota.' });
        }
        const updatePayload = {
            [`linkedVets.${vetId}`]: {
                status: 'pending',
                linkedAt: new Date().toISOString(),
                vetName: vetName
            }
        };
        await petRef.update(updatePayload);
        await createNotification(petData.ownerId, vetId, 'vet_link_request', petId, 'pet');
        res.status(200).json({ message: 'Solicitud de vínculo enviada al responsable de la mascota.' });
    } catch (error) {
        console.error('Error en requestPatientLink:', error);
        res.status(500).json({ message: error.message || 'No se pudo enviar la solicitud de vínculo.' });
    }
};

/**
 * Obtiene la lista de pacientes de un veterinario, con opción de filtrar por estado.
 */
const getLinkedPatients = async (req, res) => {
    const { uid: vetId } = req.user;
    const { status } = req.query;

    try {
        let query = db.collection('pets').where(`linkedVets.${vetId}.status`, '==', 'active');
        
        if (status && ['active', 'observation', 'discharged'].includes(status)) {
            query = query.where('patientStatus', '==', status);
        }

        const snapshot = await query.get();
        const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(patients);
    } catch (error) {
        console.error('Error en getLinkedPatients:', error);
        res.status(500).json({ message: 'Error al obtener la lista de pacientes.' });
    }
};

/**
 * Añade una nueva entrada al Expediente Clínico Digital (ECD) de un paciente.
 * Requiere una sesión clínica activa.
 */
const addHealthRecordEntry = async (req, res) => {
    const { uid: vetId, name: vetName } = req.user;
    const { petId } = req.params;
    const { recordType, data } = req.body;

    const validRecordTypes = ['consultations', 'vaccines', 'deworming', 'exams'];
    if (!recordType || !validRecordTypes.includes(recordType) || !data) {
        return res.status(400).json({ message: 'Se requiere un tipo de registro y datos válidos.' });
    }

    try {
        await getPetIfAuthorized(vetId, petId);

        const sessionActive = await isClinicalSessionActive(vetId, petId);
        if (!sessionActive) {
            return res.status(403).json({ message: 'No hay una sesión clínica activa para esta mascota. No se pueden añadir registros.' });
        }

        const newEntry = {
            ...data,
            id: admin.firestore.Timestamp.now().toMillis().toString(),
            author: { authorId: vetId, authorType: 'vet', authorName: vetName }
        };

        const petRef = db.collection('pets').doc(petId);
        await petRef.update({
            [`healthRecord.${recordType}`]: admin.firestore.FieldValue.arrayUnion(newEntry)
        });

        res.status(201).json({ message: 'Registro añadido al historial clínico con éxito.', entry: newEntry });

    } catch (error) {
        console.error('Error en addHealthRecordEntry:', error);
        res.status(500).json({ message: error.message || 'No se pudo añadir el registro.' });
    }
};

/**
 * Actualiza el estado de un paciente (Activo, En Observación, De Alta).
 */
const updatePatientStatus = async (req, res) => {
    const { uid: vetId } = req.user;
    const { petId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'observation', 'discharged'].includes(status)) {
        return res.status(400).json({ message: 'Se proporcionó un estado de paciente no válido.' });
    }

    try {
        await getPetIfAuthorized(vetId, petId);

        const petRef = db.collection('pets').doc(petId);
        await petRef.update({ patientStatus: status });

        res.status(200).json({ message: `El estado del paciente ha sido actualizado a: ${status}.` });

    } catch (error) {
        console.error('Error en updatePatientStatus:', error);
        res.status(500).json({ message: error.message || 'No se pudo actualizar el estado del paciente.' });
    }
};

module.exports = {
  findPetByEPID,
  requestPatientLink,
  getLinkedPatients,
  addHealthRecordEntry,
  updatePatientStatus
};