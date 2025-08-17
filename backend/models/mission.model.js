// backend/models/mission.model.js
// Define la estructura y los valores por defecto para un documento en la colección 'missions'.

/**
 * @typedef {'POST_PHOTO' | 'CHECK_IN' | 'PROFILE_UPDATE' | 'SOCIAL'} MissionType
 * Define el tipo de acción que el usuario debe realizar para completar la misión.
 */

/**
 * @typedef {'Creatividad' | 'Exploración' | 'Cuidado' | 'Social'} MissionCategory
 * Define la categoría temática de la misión.
 */

/**
 * @typedef {Object} MissionReward
 * @property {string} badgeName - El nombre de la insignia que se otorga.
 * @property {string} badgeImageUrl - La URL (en Google Cloud Storage) de la imagen de la insignia.
 * @property {number} points - La cantidad de 'EnlaPet Points' que se otorgan.
 */

/**
 * Devuelve el objeto base para un nuevo documento de misión.
 * Esta función es para uso interno de los administradores al crear nuevas misiones.
 * @param {Object} data - Datos para la nueva misión.
 * @param {string} data.title - Título de la misión.
 * @param {string} data.description - Descripción de lo que el usuario debe hacer.
 * @param {MissionCategory} data.category - Categoría de la misión.
 * @param {MissionType} data.type - Tipo de acción requerida.
 * @param {string} data.hashtag - Hashtag único para la verificación automática.
 * @param {MissionReward} data.reward - El objeto que define las recompensas.
 * @returns {Object} El objeto de misión para Firestore.
 */
const getNewMission = ({ title, description, category, type, hashtag, reward }) => {
    if (!title || !description || !category || !type || !hashtag || !reward || !reward.points) {
      throw new Error('Faltan campos esenciales para crear la misión.');
    }
  
    return {
      title,
      description,
      category,
      type,
      hashtag, // Ej: #ReyDeLaSiesta
      /** @type {MissionReward} */
      reward: {
        badgeName: reward.badgeName || 'Insignia Especial',
        badgeImageUrl: reward.badgeImageUrl || '',
        points: reward.points || 50,
      },
      isActive: true, // Por defecto, una nueva misión está activa.
      createdAt: new Date().toISOString(),
    };
  };
  
  module.exports = {
    getNewMission
  };