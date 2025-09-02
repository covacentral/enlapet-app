// frontend/src/context/UserContext.jsx
// VERSIÓN 3.0: Refactorizado para usar la capa de API (profile.api.js).

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile } from '../api/profile.api'; // <-- 1. Importamos la función del servicio de API

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      // 2. Reemplazamos el bloque fetch con la llamada al servicio de API.
      const profileData = await getUserProfile();
      setUserProfile(profileData);
    } catch (err) {
      setError(err.message);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const clearUserProfile = () => {
    setUserProfile(null);
  };

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
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};