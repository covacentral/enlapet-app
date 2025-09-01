// frontend/src/context/UserContext.jsx
// VERSIÓN CORREGIDA: Reacciona a los cambios de AuthContext para un flujo de datos unidireccional.

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; // <-- 1. Importamos useAuth para escuchar cambios.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Inicia en false, se activa al haber usuario.
  const [error, setError] = useState(null);
  const { currentUser } = useAuth(); // <-- 2. Obtenemos el usuario actual de AuthContext.

  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return; // No hacer nada si no hay usuario.

    setIsLoading(true);
    setError(null);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener el perfil del usuario.');
      }
      const profileData = await response.json();
      setUserProfile(profileData);
    } catch (err) {
      setError(err.message);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // <-- El currentUser es ahora la dependencia.

  const clearUserProfile = () => {
    setUserProfile(null);
  };

  // 3. Este useEffect reacciona a los cambios en currentUser.
  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    } else {
      clearUserProfile();
    }
  }, [currentUser, fetchUserProfile]);

  const value = {
    userProfile,
    isLoading,
    error,
    // Ya no es necesario exportar fetchUserProfile o clearUserProfile,
    // porque el contexto ahora se autogestiona.
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};