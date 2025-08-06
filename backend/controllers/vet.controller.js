// backend/controllers/vet.controller.js
// Lógica de negocio para las acciones exclusivas de los veterinarios verificados (Versión Corregida y Mejorada).

const { db } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

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
 * [MODIFICADO] Permite a un veterinario enviar una solicitud de vínculo usando la nueva estructura de mapa.
 */
const requestPatientLink = async (req, res) => {
  const { uid: vetId } = req.user;
  const { petId } = req.params;

  const petRef = db.collection('pets').doc(petId);

  try {
    const petDoc = await petRef.get();
    if (!petDoc.exists) {
      return res.status(404).json({ message: 'La mascota no fue encontrada.' });
    }

    const petData = petDoc.data();
    const linkedVets = petData.linkedVets || {};

    // Comprobar si ya existe un vínculo (activo o pendiente) con este veterinario
    if (linkedVets[vetId] && (linkedVets[vetId].status === 'active' || linkedVets[vetId].status === 'pending')) {
      return res.status(409).json({ message: 'Ya tienes un vínculo activo o una solicitud pendiente con esta mascota.' });
    }

    // Añadir o actualizar la solicitud de vínculo pendiente usando notación de punto para campos de mapa
    const updatePayload = {
      [`linkedVets.${vetId}`]: {
        status: 'pending',
        linkedAt: new Date().toISOString()
      }
    };
    
    await petRef.update(updatePayload);

    // Enviar notificación al dueño
    await createNotification(petData.ownerId, vetId, 'vet_link_request', petId, 'pet');

    res.status(200).json({ message: 'Solicitud de vínculo enviada al responsable de la mascota.' });
  } catch (error) {
    console.error('Error en requestPatientLink:', error);
    res.status(500).json({ message: error.message || 'No se pudo enviar la solicitud de vínculo.' });
  }
};

/**
 * [MODIFICADO] Obtiene la lista de mascotas vinculadas a un veterinario usando una consulta compatible con mapas.
 */
const getLinkedPatients = async (req, res) => {
    const { uid: vetId } = req.user;
    try {
        // La consulta ahora busca por la existencia y el estado del campo anidado en el mapa.
        const snapshot = await db.collection('pets')
            .where(`linkedVets.${vetId}.status`, '==', 'active')
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const patients = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            breed: doc.data().breed,
            petPictureUrl: doc.data().petPictureUrl,
            epid: doc.data().epid
        }));

        res.status(200).json(patients);
    } catch (error) {
        console.error('Error en getLinkedPatients:', error);
        res.status(500).json({ message: 'Error al obtener la lista de pacientes.' });
    }
};

module.exports = {
  findPetByEPID,
  requestPatientLink,
  getLinkedPatients
};