// backend/models/user.model.js
// Define la estructura y los valores por defecto para un documento de usuario en Firestore.

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
 * @property {'none' | 'vet' | 'shop' | 'foundation' | 'government'} type - El tipo de perfil verificado solicitado.
 * @property {'none' | 'pending' | 'verified' | 'rejected'} status - El estado actual de la solicitud.
 * @property {string | null} lastApplicationDate - Fecha de la última solicitud en formato ISO.
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
      // Los documentos ya no se guardan aquí, sino en la solicitud individual.
    }
  });
  
  module.exports = {
    getNewUserProfile
  };