// frontend/src/main.jsx
// Versión 2.1: Consolida la inicialización de Sentry, React Query y estilos globales.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react";

import App from './App.jsx';
import './index.css';
import 'leaflet/dist/leaflet.css'; 

// Inicialización de Sentry para el monitoreo de errores.
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

// Se crea una instancia del cliente para react-query.
const queryClient = new QueryClient();

// Se renderiza la aplicación, asegurándose de envolverla en todos los proveedores necesarios.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);