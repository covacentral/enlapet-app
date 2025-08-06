// backend/models/appointment.model.js
// (NUEVO) Define la estructura para un documento en la nueva colección 'appointments'.

/**
 * Devuelve el objeto base para un nuevo documento de cita.
 * @param {Object} details - Detalles de la cita.
 * @param {string} details.vetId - UID del veterinario.
 * @param {string} details.ownerId - UID del dueño de la mascota.
 * @param {string} details.petId - ID del documento de la mascota.
 * @param {string} details.petName - Nombre de la mascota (para visualización).
 * @param {string} details.ownerName - Nombre del dueño (para visualización).
 * @param {string} details.appointmentDate - Fecha y hora de la cita en formato ISO.
 * @param {number} details.durationMinutes - Duración de la cita.
 * @param {string} details.reason - Motivo de la consulta.
 * @returns {Object} El objeto de cita para Firestore.
 */
const getNewAppointment = ({ vetId, ownerId, petId, petName, ownerName, appointmentDate, durationMinutes, reason }) => ({
    vetId,
    ownerId,
    petId,
    petName,
    ownerName,
    appointmentDate: new Date(appointmentDate).toISOString(),
    durationMinutes,
    reason,
    /** @type {'pending' | 'confirmed' | 'cancelled' | 'completed'} */
    status: 'pending', // Las citas inician como pendientes hasta que el vet confirma.
    createdAt: new Date().toISOString(),
    session: {
        isActive: false,
        startedAt: null,
        expiresAt: null,
    }
});

module.exports = {
    getNewAppointment
};