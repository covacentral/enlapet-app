// frontend/src/api/auth.api.js
// Servicio de API para todas las operaciones de autenticación con el backend.

import apiClient from './axiosConfig';

/**
 * Registra un nuevo usuario en el backend de EnlaPet.
 * @param {Object} userData - Datos del usuario a registrar.
 * @param {string} userData.name - Nombre del usuario.
 * @param {string} userData.email - Email del usuario.
 * @param {string} userData.password - Contraseña del usuario.
 * @returns {Promise<Object>} La respuesta del backend.
 */
export const registerUserInBackend = async (userData) => {
  try {
    // apiClient ya incluye el token de autenticación
    const response = await apiClient.post('/api/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error al registrar el usuario en el backend:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'No se pudo registrar el usuario en el backend.');
  }
};

/**
 * Autentica al usuario con Google en el backend.
 * @param {string} idToken - El ID Token de Firebase Authentication.
 * @returns {Promise<Object>} La respuesta del backend.
 */
export const authenticateWithGoogleBackend = async (idToken) => {
  try {
    // Esta ruta no requiere token de autorización, pero usamos apiClient por consistencia.
    const response = await apiClient.post('/api/google', { idToken });
    return response.data;
  } catch (error) {
    console.error('Error en la autenticación con Google en el backend:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Error en la autenticación con Google en el backend.');
  }
};