// frontend/src/main.jsx
// Versión 2.0: Integración con Sentry
// TAREA: Se inicializa el SDK de Sentry para el monitoreo de errores en producción.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react"; // 1. Importamos Sentry

import './index.css';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';

// 2. Inicializamos Sentry ANTES que cualquier otra cosa
// La configuración se lee desde variables de entorno para mayor seguridad.
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Esta opción anonimiza todo el texto para proteger la privacidad del usuario.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Monitoreo de Rendimiento
  tracesSampleRate: 1.0, // Captura el 100% de las transacciones para análisis de rendimiento.
  // Repetición de Sesión
  replaysSessionSampleRate: 0.1, // Captura el 10% de las sesiones de usuario para repetición.
  replaysOnErrorSampleRate: 1.0, // Si ocurre un error, captura el 100% de esa sesión.
});


// El resto de tu archivo no cambia.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);