// backend/controllers/mission.controller.js
// Lógica de negocio para la gestión de las Misiones EnlaPet.

const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const { createNotification } = require('../services/notification.service');

/**
 * Obtiene las misiones activas y verifica cuáles han sido completadas por una mascota específica.
 */
const getMissions = async (req, res) => {
  const { petId } = req.query; // El ID de la mascota que está viendo las misiones
  const { uid } = req.user;

  if (!petId) {
    return res.status(400).json({ message: 'Se requiere el ID de la mascota (petId).' });
  }

  try {
    // Primero, verificamos que el usuario sea el dueño de la mascota
    const petDoc = await db.collection('pets').doc(petId).get();
    if (!petDoc.exists || petDoc.data().ownerId !== uid) {
        return res.status(403).json({ message: 'No autorizado para ver las misiones de esta mascota.' });
    }

    // Obtenemos todas las misiones activas en una sola consulta
    const missionsSnapshot = await db.collection('missions').where('isActive', '==', true).get();
    if (missionsSnapshot.empty) {
      return res.status(200).json([]);
    }
    const activeMissions = missionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Obtenemos las misiones ya completadas por esa mascota
    const completedMissionsSnapshot = await db.collection('pets').doc(petId).collection('completedMissions').get();
    const completedMissionIds = new Set(completedMissionsSnapshot.docs.map(doc => doc.id));

    // Combinamos la información para que el frontend sepa el estado de cada misión
    const missionsWithStatus = activeMissions.map(mission => ({
      ...mission,
      status: completedMissionIds.has(mission.id) ? 'completed' : 'available'
    }));

    res.status(200).json(missionsWithStatus);

  } catch (error) {
    console.error('Error en getMissions:', error);
    res.status(500).json({ message: 'Error interno al obtener las misiones.' });
  }
};

/**
 * Función transaccional interna para completar una misión de forma atómica.
 * No se expone como una ruta directa, es llamada por otros controladores (ej. createPost).
 * @param {FirebaseFirestore.Transaction} transaction - La transacción de Firestore en curso.
 * @param {object} data - Datos necesarios para completar la misión.
 * @param {string} data.ownerId - UID del dueño de la mascota.
 * @param {string} data.petId - ID de la mascota que completa la misión.
 * @param {object} data.mission - El documento completo de la misión.
 * @param {string} data.proofPostId - El ID del post que sirve como prueba.
 */
const completeMission = async (transaction, { ownerId, petId, mission, proofPostId }) => {
  const userRef = db.collection('users').doc(ownerId);
  const completedMissionRef = db.collection('pets').doc(petId).collection('completedMissions').doc(mission.id);

  // Verificación de seguridad dentro de la transacción
  const completedDoc = await transaction.get(completedMissionRef);
  if (completedDoc.exists) {
    console.log(`Intento de completar misión ya realizada: ${mission.id} por mascota ${petId}`);
    // No lanzamos un error para no interrumpir la creación del post, simplemente no hacemos nada.
    return;
  }

  // 1. Escribir el hito en el diario de la mascota
  transaction.set(completedMissionRef, {
    completedAt: new Date().toISOString(),
    status: 'completed',
    proof: {
      type: 'POST',
      postId: proofPostId,
    },
  });

  // 2. Actualizar los EnlaPet Points del usuario
  transaction.update(userRef, {
    enlaPetPoints: admin.firestore.FieldValue.increment(mission.reward.points || 0),
  });
  
  // La notificación se creará fuera de la transacción para evitar contención
};

module.exports = {
  getMissions,
  completeMission, // Exportamos para que otros controladores puedan usarla
};