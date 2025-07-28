import axios from 'axios';

// La URL base de tu API en Render.
// Es una buena práctica tener esto como una variable de entorno,
// pero por ahora lo dejamos así para simplicidad.
const API_URL = 'https://enlapet-api.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Usamos un "interceptor" de Axios. Es una función que se ejecuta
// ANTES de que cada petición sea enviada.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Si hay un token en el localStorage, lo añadimos a la cabecera 'Authorization'.
      // El backend usará este token para verificar quién es el usuario.
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Si hay un error al configurar la petición, lo rechazamos.
    return Promise.reject(error);
  }
);

// Exportamos un objeto con métodos simplificados para hacer peticiones.
// Esto nos permite llamar `api.get('/ruta')` en vez de escribir
// toda la lógica de axios cada vez.
export default {
    get: (endpoint, params) => api.get(endpoint, { params }),
    post: (endpoint, data) => api.post(endpoint, data),
    put: (endpoint, data) => api.put(endpoint, data),
    delete: (endpoint) => api.delete(endpoint),
};
