// frontend/vite.config.js
// Versión 3.0: Solución de compatibilidad con iOS/Safari.
// TAREA: Se elimina el plugin legacy y se establece un build.target explícito a 'es2020'
// para garantizar la máxima compatibilidad con navegadores modernos, especialmente Webkit.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
    // El plugin legacy() ha sido eliminado. No es la solución correcta para este problema.
  ],
  build: {
    // Esta es la línea clave. Forzamos a Vite/ESBuild a transpilar
    // cualquier sintaxis de JS muy moderna a un estándar con soporte universal (ES2020).
    // Esto resuelve los errores de "pantalla negra" en iOS sin un impacto
    // perceptible en el rendimiento para otros navegadores.
    target: 'es2020'
  }
})