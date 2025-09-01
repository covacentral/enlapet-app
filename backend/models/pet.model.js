// backend/models/pet.model.js
// Define la estructura y los valores por defecto para un documento de mascota en Firestore.
// VERSIÓN 2.0: Introduce esquemas de validación con Zod.

const { z } = require('zod');
const { customAlphabet } = require('nanoid');

const generateEPID = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

/**
 * @typedef {Object} PetLocation
 * @property {string} country
 * @property {string} department
 * @property {string} city
 */
const petLocationSchema = z.object({
  country: z.string().optional(),
  department: z.string().optional(),
  city: z.string().optional(),
});

/**
 * @typedef {Object} HealthRecord
 * @property {string} birthDate
 * @property {'Macho' | 'Hembra' | ''} gender
 * @property {Array<Object>} vaccines
 * @property {Array<Object>} medicalHistory
 */
const healthRecordSchema = z.object({
  birthDate: z.string().optional(),
  gender: z.enum(['Macho', 'Hembra', '']).optional(),
  vaccines: z.array(z.object({
    id: z.string(),
    name: z.string(),
    date: z.string(),
    nextDate: z.string().optional(),
  })).optional(),
  medicalHistory: z.array(z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    description: z.string(),
  })).optional(),
});


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
  linkedVets: [],
  activeVetIds: [],
  rescueMode: {
    isActive: false,
    activatedAt: null,
    lastSeen: {
      coordinates: null,
      address: '',
      radius: 1000
    },
    message: '',
    showContactPhone: true
  },
  unclaimedInfo: {
    isUnclaimed: false,
    ownerIdentifier: null,
    createdByVet: null
  }
});

// --- Esquemas de Zod para Validación ---

const basePetSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(50, "El nombre no puede exceder los 50 caracteres."),
  breed: z.string().max(50, "La raza no puede exceder los 50 caracteres.").optional(),
  location: petLocationSchema.optional(),
  healthRecord: healthRecordSchema.optional(),
});

const createPetSchema = z.object({
    name: z.string().min(2, "El nombre es requerido.").max(50),
    breed: z.string().max(50).optional(),
});

const updatePetSchema = basePetSchema.partial();

module.exports = {
  getNewPetProfile,
  createPetSchema,
  updatePetSchema,
};