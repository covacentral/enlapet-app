// frontend/vite.config.js
// Versión 2.0: Añade el plugin legacy para dar soporte a navegadores antiguos.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy' // 1. Importamos el plugin legacy

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({ // 2. Añadimos el plugin a la configuración
      targets: ['defaults', 'not IE 11']
    })
  ],
})