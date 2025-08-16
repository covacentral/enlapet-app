// frontend/vite.config.js
// Versión 5.0: Integración con Sentry
// TAREA: Se añade el plugin de Sentry para la subida automática de source maps
// y se activa la generación de los mismos en el build.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { sentryVitePlugin } from "@sentry/vite-plugin"; // 1. Importamos el plugin de Sentry

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    // 2. Añadimos el plugin de Sentry al final de la lista.
    // Este se encargará de subir los sourcemaps durante el build.
    sentryVitePlugin({
      org: "cova-central-sas", // Reemplaza esto con el 'slug' de tu organización en Sentry
      project: "enlapet-frontend"
    })
  ],
  build: {
    // 3. Habilitamos la generación de sourcemaps.
    sourcemap: true,
  }
});