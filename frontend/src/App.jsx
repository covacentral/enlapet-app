// frontend/src/App.jsx
// Versión: 2.0 - Diagnóstico
// Añade un panel de diagnóstico para verificar la URL del backend en entornos de previsualización.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import './App.css';

import AuthPage from './AuthPage.jsx';
import ProfileLayout from './ProfileLayout.jsx';
import PetProfile from './PetProfile.jsx';
import LoadingComponent from './LoadingComponent.jsx';

// --- Componente del Panel de Diagnóstico ---
const DevDiagnosticPanel = () => {
  // Vercel inyecta esta variable de entorno. Será 'production', 'preview', o 'development'.
  const env = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;

  // Solo mostramos el panel si no estamos en producción.
  if (env === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      border: '1px solid #444'
    }}>
      <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>
        <span style={{ color: env === 'development' ? '#61dafb' : '#ffc107' }}>
          {env.toUpperCase()} MODE
        </span>
      </p>
      <p style={{ margin: '4px 0 0', padding: 0 }}>
        <span style={{ color: '#aaa' }}>API URL: </span>
        <span style={{ color: '#50fa7b' }}>{apiUrl || 'NOT SET'}</span>
      </p>
    </div>
  );
};


function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingComponent text="Cargando EnlaPet..." />;
  }

  return (
    <div className="App">
      {/* Añadimos el panel de diagnóstico aquí */}
      <DevDiagnosticPanel />

      <Routes>
        <Route path="/pet/:petId" element={<PetProfile />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              <ProfileLayout user={user} />
            </ProtectedRoute>
          } 
        />

        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
