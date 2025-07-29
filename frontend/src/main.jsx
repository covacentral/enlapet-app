import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx'; // Importamos el provider
import { BrowserRouter as Router } from 'react-router-dom';

// Envolvemos toda la aplicación con nuestro AuthProvider para que
// todos los componentes hijos puedan acceder al contexto de autenticación.
// También la envolvemos con el Router para habilitar el enrutamiento.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);
