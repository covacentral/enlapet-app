// backend/models/user.model.js
// Define la estructura y los valores por defecto para un documento de usuario en Firestore.
// VERSIÓN 2.0: Introduce esquemas de validación con Zod.

const { z } = require('zod');

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
  enlaPetPoints: 0,
  /** @type {UserVerification} */
  verification: {
    type: 'none',
    status: 'none',
    lastApplicationDate: null,
  }
});

// --- [NUEVO] Esquema de Zod para la validación de datos del usuario ---

// Esquema para la estructura de localización
const locationSchema = z.object({
  country: z.string().optional(),
  department: z.string().optional(),
  city: z.string().optional(),
});

// Esquema para la configuración de privacidad
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private']).optional(),
  showEmail: z.enum(['private', 'followers', 'public']).optional(),
});

// Esquema base completo para un perfil de usuario
const userSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50, "El nombre no puede exceder los 50 caracteres."),
  bio: z.string().max(70, "La biografía no puede exceder los 70 caracteres.").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Número de teléfono inválido.").optional().or(z.literal('')),
  location: locationSchema.optional(),
  privacySettings: privacySettingsSchema.optional(),
});

// Esquema para la actualización del perfil. Es una versión parcial del esquema base.
const updateUserSchema = userSchema.partial();


module.exports = {
  getNewUserProfile,
  userSchema,
  updateUserSchema,
};