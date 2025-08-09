// backend/models/appointment.model.js
// Define la estructura y los valores por defecto para un documento de cita en Firestore.

/**
 * @typedef {'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_vet' | 'completed' | 'no_show'} AppointmentStatus
 * El estado de la cita:
 * - pending: El usuario la solicitó, pendiente de confirmación del veterinario.
 * - confirmed: El veterinario ha confirmado la cita.
 * - cancelled_by_user: El usuario canceló la cita.
 * - cancelled_by_vet: El veterinario canceló la cita.
 * - completed: La cita se llevó a cabo con éxito.
 * - no_show: El paciente no se presentó a la cita.
 */

/**
 * Devuelve el objeto base para un nuevo documento de cita.
 * @param {object} data - Datos para la nueva cita.
 * @param {string} data.vetId - UID del veterinario.
 * @param {string} data.ownerId - UID del dueño de la mascota.
 * @param {string} data.petId - ID del documento de la mascota.
 * @param {string} data.appointmentDate - Fecha y hora de la cita en formato ISO string.
 * @param {number} data.duration - Duración de la cita en minutos (ej. 30).
 * @param {string} data.reason - Motivo de la consulta.
 * @returns {object} El objeto de cita para Firestore.
 */
const getNewAppointment = ({ vetId, ownerId, petId, appointmentDate, duration, reason }) => {
    if (!vetId || !ownerId || !petId || !appointmentDate || !duration || !reason) {
      throw new Error('Faltan datos esenciales para crear la cita.');
    }
  
    return {
      vetId,
      ownerId,
      petId,
      appointmentDate: new Date(appointmentDate).toISOString(),
      duration, // en minutos
      reason,
      /** @type {AppointmentStatus} */
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cancellationReason: '', // Se llenará si el veterinario cancela
    };
  };
  
  module.exports = {
    getNewAppointment
  };