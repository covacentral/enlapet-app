import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import './App.css';

import AuthPage from './AuthPage';
import ProfileLayout from './ProfileLayout';
import PetProfile from './PetProfile';

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
    return <div className="App-header"><h1>Cargando EnlaPet...</h1></div>;
  }

  return (
    <div className="App">
      <Routes>
        {/* Ruta para el perfil público de la mascota. Es específica y se evalúa primero. */}
        <Route path="/pet/:petId" element={<PetProfile />} />
        
        {/* Ruta para el panel de control del usuario. */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              <ProfileLayout user={user} />
            </ProtectedRoute>
          } 
        />

        {/* Ruta principal: decide si mostrar el login o redirigir al dashboard. */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
        
        {/* Ruta comodín para cualquier otra URL no encontrada. */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
