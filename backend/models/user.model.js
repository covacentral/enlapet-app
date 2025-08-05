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
 * @property {'none' | 'vet' | 'shop' | 'foundation' | 'government'} type - El tipo de perfil verificado.
 * @property {'none' | 'pending' | 'verified' | 'rejected'} status - El estado de la solicitud.
 * @property {string | null} applicationDate - Fecha de la solicitud en formato ISO.
 * @property {Array<string>} documents - URLs a los documentos de soporte en Firebase Storage.
 * @property {string} rejectionReason - Motivo del rechazo (si aplica).
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
    userType: 'personal', // Tipo de cuenta por defecto
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
      applicationDate: null,
      documents: [],
      rejectionReason: ''
    }
  });
  
  module.exports = {
    getNewUserProfile
  };