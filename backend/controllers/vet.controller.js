// backend/controllers/vet.controller.js
// Lógica de negocio para las acciones exclusivas de los veterinarios verificados.

const { db } = require('../config/firebase');
const { createNotification } = require('../services/notification.service');
const admin = require('firebase-admin');

// ... (findPetByEPID, requestPatientLink no cambian)
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

// --- FUNCIÓN CORREGIDA ---
const getLinkedPatients = async (req, res) => {
    const { uid: vetId } = req.user;
    try {
        // 1. Buscamos todas las mascotas que tengan el ID del veterinario en su lista.
        const snapshot = await db.collection('pets')
            .where('linkedVets', '!=', []) // Filtro inicial para optimizar
            .get();

        // 2. Filtramos los resultados en el servidor para encontrar los vínculos activos.
        const activePatients = [];
        snapshot.forEach(doc => {
            const petData = doc.data();
            const hasActiveLink = petData.linkedVets?.some(link => link.vetId === vetId && link.status === 'active');
            if (hasActiveLink) {
                activePatients.push({ id: doc.id, ...petData });
            }
        });

        if (activePatients.length === 0) {
            return res.status(200).json([]);
        }
        
        const ownerIds = new Set(activePatients.map(p => p.ownerId));
        
        const ownersData = {};
        if (ownerIds.size > 0) {
            const ownersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', Array.from(ownerIds)).get();
            ownersSnapshot.forEach(doc => {
                ownersData[doc.id] = { name: doc.data().name, phone: doc.data().phone || '' };
            });
        }

        const enrichedPatients = activePatients.map(p => ({
            ...p,
            ownerInfo: ownersData[p.ownerId] || { name: 'Desconocido' }
        }));

        res.status(200).json(enrichedPatients);
    } catch (error) {
        console.error('Error en getLinkedPatients:', error);
        res.status(500).json({ message: 'Error interno al obtener la lista de pacientes.' });
    }
};

const updateAvailability = async (req, res) => {
    const { uid: vetId } = req.user;
    const weeklySchedule = req.body;

    if (!weeklySchedule || typeof weeklySchedule !== 'object') {
        return res.status(400).json({ message: 'Se requiere un objeto de horario válido.' });
    }

    try {
        const vetRef = db.collection('users').doc(vetId);
        const batch = db.batch();

        for (const dayKey in weeklySchedule) {
            if (Object.hasOwnProperty.call(weeklySchedule, dayKey)) {
                const dayData = weeklySchedule[dayKey];
                const dayRef = vetRef.collection('availability').doc(dayKey);
                batch.set(dayRef, dayData);
            }
        }

        await batch.commit();
        res.status(200).json({ message: 'Horario actualizado con éxito.' });

    } catch (error) {
        console.error('Error en updateAvailability:', error);
        res.status(500).json({ message: 'Error interno al guardar el horario.' });
    }
};

const getAvailability = async (req, res) => {
    const { uid: vetId } = req.user;
    try {
        const availabilitySnapshot = await db.collection('users').doc(vetId).collection('availability').get();

        if (availabilitySnapshot.empty) {
            return res.status(200).json({});
        }

        const schedule = {};
        availabilitySnapshot.forEach(doc => {
            schedule[doc.id] = doc.data();
        });

        res.status(200).json(schedule);

    } catch (error) {
        console.error('Error en getAvailability:', error);
        res.status(500).json({ message: 'Error interno al obtener el horario.' });
    }
};

const getPatientDetails = async (req, res) => {
    const { uid: vetId } = req.user;
    const { petId } = req.params;

    try {
        const petRef = db.collection('pets').doc(petId);
        const petDoc = await petRef.get();

        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        const petData = petDoc.data();
        const hasActiveLink = petData.linkedVets?.some(link => link.vetId === vetId && link.status === 'active');
        
        if (!hasActiveLink) {
            return res.status(403).json({ message: 'No tienes un vínculo activo con este paciente.' });
        }

        res.status(200).json({ id: petDoc.id, ...petData });
    } catch (error) {
        console.error('Error en getPatientDetails:', error);
        res.status(500).json({ message: 'Error interno al obtener los detalles del paciente.' });
    }
};

const addHealthRecordEntry = async (req, res) => {
    const { uid: vetId } = req.user;
    const { petId } = req.params;
    const { type, record } = req.body; 

    if (!type || !record || (type !== 'vaccine' && type !== 'medicalHistory')) {
        return res.status(400).json({ message: 'Se requiere un tipo de registro y datos válidos.' });
    }

    const petRef = db.collection('pets').doc(petId);

    try {
        const petDoc = await petRef.get();
        if (!petDoc.exists) {
            return res.status(404).json({ message: 'Paciente no encontrado.' });
        }

        const petData = petDoc.data();
        const hasActiveLink = petData.linkedVets?.some(link => link.vetId === vetId && link.status === 'active');
        
        if (!hasActiveLink) {
            return res.status(403).json({ message: 'No tienes permiso para modificar este carné de salud.' });
        }
        
        const fieldToUpdate = type === 'vaccine' ? 'healthRecord.vaccines' : 'healthRecord.medicalHistory';
        
        await petRef.update({
            [fieldToUpdate]: admin.firestore.FieldValue.arrayUnion(record)
        });

        await createNotification(petData.ownerId, vetId, 'health_record_updated', petId, 'pet');

        res.status(200).json({ message: 'Carné de salud actualizado con éxito.' });
    } catch (error) {
        console.error('Error en addHealthRecordEntry:', error);
        res.status(500).json({ message: 'Error interno al añadir el registro.' });
    }
};


module.exports = {
  findPetByEPID,
  requestPatientLink,
  getLinkedPatients,
  updateAvailability,
  getAvailability,
  getPatientDetails,
  addHealthRecordEntry
};