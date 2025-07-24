import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. Importamos el BrowserRouter
import './index.css';
import App from './App.jsx';
import 'leaflet/dist/leaflet.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. Envolvemos nuestra App con el BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
