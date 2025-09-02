// frontend/src/api/profile.api.js
// Servicio de API para todas las operaciones relacionadas con perfiles de usuario.

import apiClient from './axiosConfig';

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 * @returns {Promise<Object>} Los datos del perfil del usuario.
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/api/profile');
    return response.data;
  } catch (error) {
    console.error('Error al obtener el perfil de usuario:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'No se pudo obtener el perfil del usuario.');
  }
};