// backend/models/pet.model.js
// Define la estructura y los valores por defecto para un documento de mascota en Firestore.

const { customAlphabet } = require('nanoid');
const generateEPID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

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
  location: { country: 'Colombia', department: '', city: '' },
  healthRecord: { birthDate: '', gender: '', vaccines: [], medicalHistory: [] },
  followersCount: 0,
  /** @type {Object.<string, VetLink>} */
  linkedVets: {}, // <-- CAMBIO ESTRUCTURAL: De Array a Objeto (Mapa)
  unclaimedInfo: {
    isUnclaimed: false,
    ownerIdentifier: null,
    createdByVet: null
  }
});

module.exports = {
  getNewPetProfile
};