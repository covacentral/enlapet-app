// frontend/src/context/PetContext.jsx
// VERSIÓN 3.0: Refactorizado para usar la capa de API (pets.api.js).

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getPets } from '../api/pets.api'; // <-- 1. Importamos la función del servicio de API

const PetContext = createContext();

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets debe ser usado dentro de un PetProvider');
  }
  return context;
};

export const PetProvider = ({ children }) => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const fetchPets = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      // 2. Reemplazamos el bloque fetch con la llamada al servicio de API.
      const petsData = await getPets();
      setPets(Array.isArray(petsData) ? petsData : []);
    } catch (err) {
      setError(err.message);
      setPets([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const clearPets = () => {
    setPets([]);
  };

  useEffect(() => {
    if (currentUser) {
      fetchPets();
    } else {
      clearPets();
    }
  }, [currentUser, fetchPets]);

  const value = {
    pets,
    isLoading,
    error,
    fetchPets,
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};