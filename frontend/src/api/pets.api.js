// frontend/src/api/pets.api.js
// Servicio de API para todas las operaciones relacionadas con mascotas.

import apiClient from './axiosConfig';

/**
 * Obtiene la lista de mascotas del usuario actualmente autenticado.
 * @returns {Promise<Array<Object>>} Un array con los perfiles de las mascotas.
 */
export const getPets = async () => {
  try {
    const response = await apiClient.get('/api/pets');
    return response.data;
  } catch (error) {
    console.error('Error al obtener las mascotas:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'No se pudo obtener la lista de mascotas.');
  }
};