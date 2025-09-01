// frontend/src/context/UserContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 1. Creamos el Contexto
const UserContext = createContext();

// 2. Hook personalizado para consumir el contexto
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};

// 3. Creamos el Proveedor del Contexto
export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
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
  }, []);

  const clearUserProfile = () => {
    setUserProfile(null);
  };

  const value = {
    userProfile,
    isLoading,
    error,
    fetchUserProfile,
    clearUserProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};