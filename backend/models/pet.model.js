// backend/models/pet.model.js
// Versión 3.0 - Arquitectura para Expediente Clínico Digital (ECD)
// TAREA: Se expande la estructura de datos para soportar el ECD avanzado y el estado del paciente.

const { customAlphabet } = require('nanoid');
const generateEPID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * @typedef {Object} HealthRecordEntryAuthor
 * @property {string} authorId - UID del veterinario o del dueño.
 * @property {'vet' | 'owner'} authorType - El tipo de perfil que hizo el registro.
 * @property {string} authorName - El nombre del autor para visualización rápida.
 */

/**
 * @typedef {Object} VetLink
 * @property {'pending' | 'active' | 'revoked'} status - Estado del vínculo.
 * @property {string} linkedAt - Fecha del vínculo en formato ISO.
 */

/**
 * Devuelve el objeto base para un nuevo perfil de mascota.
 * @param {string} ownerId - UID del dueño.
 * @param {string} name - Nombre de la mascota.
 * @param {string} [breed=''] - Raza de la mascota.
 * @returns {Object} El objeto de perfil de mascota para Firestore.
 */
const getNewPetProfile = (ownerId, name, breed = '') => ({
  ownerId,
  name,
  breed,
  epid: generateEPID(),
  createdAt: new Date().toISOString(),
  petPictureUrl: '',
  /** @type {'active' | 'observation' | 'discharged'} */
  patientStatus: 'active', // Estado por defecto para nuevos pacientes.
  location: { country: 'Colombia', department: '', city: '' },
  healthRecord: {
    birthDate: '',
    gender: '',
    /** * @typedef {Object} ConsultationRecord
     * @property {string} id - UUID
     * @property {string} date - Fecha de la consulta
     * @property {HealthRecordEntryAuthor} author
     * @property {string} subjective - Lo que reporta el dueño.
     * @property {Object} objective - Datos medibles.
     * @property {number} objective.weightKg
     * @property {number} objective.temperatureC
     * @property {number} objective.heartRateBpm
     * @property {number} objective.respiratoryRateRpm
     * @property {string} appreciation - Diagnóstico.
     * @property {string} plan - Plan de tratamiento.
     */
    consultations: [], // Array para registros tipo SOAP.
    /** * @typedef {Object} VaccineRecord
     * @property {string} id - UUID
     * @property {string} name - Nombre de la vacuna
     * @property {string} date - Fecha de aplicación
     * @property {string} nextDate - Próximo refuerzo (opcional)
     * @property {HealthRecordEntryAuthor} author
     */
    vaccines: [],
    /** * @typedef {Object} DewormingRecord
     * @property {string} id - UUID
     * @property {string} product - Nombre del producto
     * @property {string} date - Fecha de aplicación
     * @property {string} nextDate - Próxima dosis (opcional)
     * @property {HealthRecordEntryAuthor} author
     */
    deworming: [], // Nueva categoría para desparasitaciones.
    /** * @typedef {Object} ExamRecord
     * @property {string} id - UUID
     * @property {string} name - Nombre del examen (ej. 'Hemograma')
     * @property {string} date - Fecha del examen
     * @property {string} resultsUrl - URL al archivo del resultado (PDF/Imagen)
     * @property {HealthRecordEntryAuthor} author
     */
    exams: [] // Nueva categoría para exámenes.
  },
  followersCount: 0,
  /** @type {Object.<string, VetLink>} */
  linkedVets: {},
  unclaimedInfo: {
    isUnclaimed: false,
    ownerIdentifier: null,
    createdByVet: null
  }
});

module.exports = {
  getNewPetProfile
};