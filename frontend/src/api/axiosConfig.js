// frontend/src/api/axiosConfig.js
// Configuración centralizada de la instancia de Axios.

import axios from 'axios';
import { auth } from '../firebase';

// 1. Creamos una instancia de Axios con la URL base de nuestra API.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// 2. Usamos un interceptor para añadir dinámicamente el token de autenticación a cada solicitud.
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const idToken = await user.getIdToken(true); // El 'true' fuerza la actualización del token si ha expirado.
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => {
    // Esto se ejecutará si hay un error al configurar la solicitud.
    return Promise.reject(error);
  }
);

export default apiClient;