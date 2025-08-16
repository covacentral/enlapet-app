// frontend/vite.config.js
// Versión 4.0: Implementación de @vitejs/plugin-legacy
// TAREA: Se reintroduce el plugin legacy para garantizar la máxima compatibilidad
// con navegadores más antiguos, especialmente Safari en iOS, solucionando el
// problema de la "pantalla negra".

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy'; // 1. Importamos el plugin legacy

export default defineConfig({
  plugins: [
    react(),
    // 2. Invocamos el plugin legacy.
    // Esto generará un "chunk" de polyfills y transpilará el código
    // usando Babel para asegurar que funcione en navegadores más antiguos.
    legacy({
      // El target se define aquí para que el plugin sepa qué navegadores soportar.
      // Dejándolo en blanco o usando 'defaults' es una buena práctica.
      targets: ['defaults', 'not IE 11'],
    })
  ],
  build: {
    // Ya no es necesario forzar el target aquí, el plugin legacy se encarga
    // de una transpilación más robusta. Lo eliminamos para evitar conflictos.
    // target: 'es2020' <-- ELIMINADO
  }
});