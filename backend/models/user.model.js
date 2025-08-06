// backend/models/user.model.js
// Versión 2.0 - Arquitectura para Módulo de Veterinarias
// TAREA: Se añade la estructura de `vetSettings` para soportar la configuración del agendamiento.

/**
 * @typedef {Object} UserLocation
 * @property {string} country
 * @property {string} department
 * @property {string} city
 */

/**
 * @typedef {Object} UserPrivacySettings
 * @property {'public' | 'private'} profileVisibility
 * @property {'private' | 'followers' | 'public'} showEmail
 */

/**
 * @typedef {Object} UserVerification
 * @property {'none' | 'vet' | 'shop' | 'foundation' | 'government'} type
 * @property {'none' | 'pending' | 'verified' | 'rejected'} status
 * @property {string | null} lastApplicationDate
 */

/**
 * @typedef {Object} VetSettings
 * @property {number} consultationDurationMinutes - Duración estándar de una consulta.
 * @property {Object} workHours - Horarios de trabajo.
 */

/**
 * Devuelve el objeto base para un nuevo perfil de usuario.
 * @param {string} name - Nombre del usuario.
 * @param {string} email - Email del usuario.
 * @param {string} [profilePictureUrl=''] - URL de la foto de perfil inicial.
 * @returns {Object} El objeto de perfil de usuario para Firestore.
 */
const getNewUserProfile = (name, email, profilePictureUrl = '') => ({
  name,
  email,
  createdAt: new Date().toISOString(),
  userType: 'personal',
  profilePictureUrl,
  coverPhotoUrl: '',
  bio: '',
  phone: '',
  /** @type {UserLocation} */
  location: { country: 'Colombia', department: '', city: '' },
  /** @type {UserPrivacySettings} */
  privacySettings: { profileVisibility: 'public', showEmail: 'private' },
  followersCount: 0,
  followingCount: 0,
  /** @type {UserVerification} */
  verification: {
    type: 'none',
    status: 'none',
    lastApplicationDate: null,
  },
  /** @type {VetSettings | null} */
  vetSettings: null, // Se inicializa como nulo. Se poblará si el usuario se verifica como 'vet'.
});

module.exports = {
  getNewUserProfile
};