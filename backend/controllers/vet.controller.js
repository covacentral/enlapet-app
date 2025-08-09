// backend/controllers/vet.controller.js
// Lógica de negocio para las acciones exclusivas de los veterinarios verificados.

const { db } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');

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
 * Permite a un veterinario enviar una solicitud para vincularse a una mascota como su paciente.
 */
const requestPatientLink = async (req, res) => {
  const { uid: vetId } = req.user;
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

      const existingLink = linkedVets.find(link => link.vetId === vetId);
      if (existingLink && (existingLink.status === 'active' || existingLink.status === 'pending')) {
        throw new Error('Ya tienes un vínculo activo o una solicitud pendiente con esta mascota.');
      }
      
      const updatedLinks = linkedVets.filter(link => link.vetId !== vetId);

      const newLinkRequest = {
        vetId,
        linkedAt: new Date().toISOString(),
        status: 'pending'
      };
      updatedLinks.push(newLinkRequest);

      transaction.update(petRef, { linkedVets: updatedLinks });

      await createNotification(petData.ownerId, vetId, 'vet_link_request', petId, 'pet');
    });

    res.status(200).json({ message: 'Solicitud de vínculo enviada al responsable de la mascota.' });
  } catch (error) {
    console.error('Error en requestPatientLink:', error);
    res.status(400).json({ message: error.message || 'No se pudo enviar la solicitud de vínculo.' });
  }
};

/**
 * [NUEVO] Obtiene la lista de pacientes (mascotas) activamente vinculados a un veterinario.
 */
const getLinkedPatients = async (req, res) => {
    const { uid: vetId } = req.user;
    try {
        const snapshot = await db.collection('pets')
            .where('linkedVets', 'array-contains', { vetId, status: 'active' })
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        
        // Mapeamos los datos de las mascotas y recolectamos los IDs de sus dueños.
        const ownerIds = new Set();
        const patients = snapshot.docs.map(doc => {
            const petData = doc.data();
            ownerIds.add(petData.ownerId);
            return {
                id: doc.id,
                ...petData
            };
        });
        
        // Consultamos los datos de los dueños para enriquecer la respuesta.
        const ownersData = {};
        if (ownerIds.size > 0) {
            const ownersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(ownerIds)).get();
            ownersSnapshot.forEach(doc => {
                ownersData[doc.id] = { name: doc.data().name, phone: doc.data().phone || '' };
            });
        }

        // Añadimos la información del dueño a cada paciente.
        const enrichedPatients = patients.map(p => ({
            ...p,
            ownerInfo: ownersData[p.ownerId] || { name: 'Desconocido' }
        }));

        res.status(200).json(enrichedPatients);
    } catch (error) {
        console.error('Error en getLinkedPatients:', error);
        res.status(500).json({ message: 'Error interno al obtener la lista de pacientes.' });
    }
};


module.exports = {
  findPetByEPID,
  requestPatientLink,
  getLinkedPatients, // Exportamos la nueva función
};