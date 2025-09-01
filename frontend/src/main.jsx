// frontend/src/main.jsx
// Versión 3.1: Integra PetProvider y corrige el orden de anidación de los contextos.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { PetProvider } from './context/PetContext.jsx'; // <-- 1. Importamos PetProvider
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
        {/* 2. Corregimos y anidamos los proveedores en el orden correcto. */}
        {/* AuthProvider es el más externo, ya que UserProvider y PetProvider dependen de él. */}
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