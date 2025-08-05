// backend/models/pet.model.js
// Define la estructura y los valores por defecto para un documento de mascota en Firestore.

// Usaremos una versión de nanoid compatible con CommonJS (la que instalamos es v3.x)
const { customAlphabet } = require('nanoid');

// Generador para el EnlaPet ID (EPID): 6 caracteres, alfanumérico, mayúsculas.
const generateEPID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * @typedef {Object} PetLocation
 * @property {string} country
 * @property {string} department
 * @property {string} city
 */

/**
 * @typedef {Object} HealthRecord
 * @property {string} birthDate
 * @property {'Macho' | 'Hembra' | ''} gender
 * @property {Array<Object>} vaccines
 * @property {Array<Object>} medicalHistory
 */

/**
 * @typedef {Object} VetLink
 * @property {string} vetId - UID del veterinario vinculado.
 * @property {string} linkedAt - Fecha del vínculo en formato ISO.
 * @property {'pending' | 'active' | 'revoked'} status - Estado del vínculo.
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
  epid: generateEPID(), // Asignamos un EnlaPet ID único al nacer
  createdAt: new Date().toISOString(),
  petPictureUrl: '',
  /** @type {PetLocation} */
  location: { country: 'Colombia', department: '', city: '' },
  /** @type {HealthRecord} */
  healthRecord: { birthDate: '', gender: '', vaccines: [], medicalHistory: [] },
  followersCount: 0,
  /** @type {Array<VetLink>} */
  linkedVets: [], // Array para almacenar los IDs y estados de los veterinarios vinculados
  // Para perfiles creados por veterinarios para dueños sin cuenta
  unclaimedInfo: {
    isUnclaimed: false,
    ownerIdentifier: null, // ej. Cédula o teléfono del dueño
    createdByVet: null // ID del veterinario que lo creó
  }
});

module.exports = {
  getNewPetProfile
};