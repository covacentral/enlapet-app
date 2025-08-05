// backend/controllers/vet.controller.js
// Lógica de negocio para las acciones exclusivas de los veterinarios verificados.

const { db } = require('../config/firebase');
const admin = require('firebase-admin');

/**
 * Busca un perfil de mascota por su EnlaPet ID (EPID).
 * Devuelve un perfil público simplificado para la vinculación.
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

    // Devolvemos solo la información necesaria para que el veterinario confirme la mascota
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
 * Permite a un veterinario enviar una solicitud para vincularse a una mascota como su paciente.
 */
const requestPatientLink = async (req, res) => {
  const { uid: vetId } = req.user; // UID del veterinario
  const { petId } = req.params;

  const petRef = db.collection('pets').doc(petId);

  try {
    await db.runTransaction(async (transaction) => {
      const petDoc = await transaction.get(petRef);
      if (!petDoc.exists) {
        throw new Error('La mascota no fue encontrada.');
      }

      const petData = petDoc.data();
      const linkedVets = petData.linkedVets || [];

      // Comprobar si ya existe un vínculo (activo o pendiente)
      const existingLink = linkedVets.find(link => link.vetId === vetId);
      if (existingLink && (existingLink.status === 'active' || existingLink.status === 'pending')) {
        throw new Error('Ya tienes un vínculo activo o una solicitud pendiente con esta mascota.');
      }
      
      // Eliminar cualquier vínculo revocado o rechazado anterior para crear uno nuevo
      const updatedLinks = linkedVets.filter(link => link.vetId !== vetId);

      // Añadir la nueva solicitud de vínculo pendiente
      const newLinkRequest = {
        vetId,
        linkedAt: new Date().toISOString(),
        status: 'pending'
      };
      updatedLinks.push(newLinkRequest);

      transaction.update(petRef, { linkedVets: updatedLinks });

      // Aquí se podría añadir una notificación para el dueño de la mascota
      // await createNotification(petData.ownerId, vetId, 'vet_link_request', petId, 'pet');
    });

    res.status(200).json({ message: 'Solicitud de vínculo enviada al responsable de la mascota.' });
  } catch (error) {
    console.error('Error en requestPatientLink:', error);
    res.status(400).json({ message: error.message || 'No se pudo enviar la solicitud de vínculo.' });
  }
};


module.exports = {
  findPetByEPID,
  requestPatientLink,
};