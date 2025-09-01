// frontend/src/main.jsx
// VERSIÓN CORREGIDA: Establece el orden de anidación correcto para los proveedores de contexto.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { PetProvider } from './context/PetContext.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Inicialización de Sentry (sin cambios)
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* El orden correcto es AuthProvider en el nivel más externo. */}
        {/* UserProvider y PetProvider son "hijos" que consumen el estado de AuthProvider. */}
        <AuthProvider>
          <UserProvider>
            <PetProvider>
              <App />
            </PetProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);