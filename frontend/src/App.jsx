// frontend/src/App.jsx
// Versión: 2.4 - Añadida Ruta de Notificaciones
// Se añade la ruta para la nueva página de notificaciones.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import './App.css';

import AuthPage from './AuthPage.jsx';
import ProfileLayout from './ProfileLayout.jsx';
import PetProfile from './PetProfile.jsx';
import LoadingComponent from './LoadingComponent.jsx';

function ProtectedRoute({ user, isLoading, children }) {
  if (isLoading) {
    return <LoadingComponent text="Verificando sesión..." />;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return <LoadingComponent text="Iniciando EnlaPet..." />;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/pet/:petId" element={<PetProfile />} />
        
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute user={user} isLoading={isAuthLoading}>
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
