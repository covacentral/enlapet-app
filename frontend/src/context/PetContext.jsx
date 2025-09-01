// frontend/src/context/PetContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// 1. Creamos el Contexto
const PetContext = createContext();

// 2. Hook personalizado para consumir el contexto
export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePets debe ser usado dentro de un PetProvider');
  }
  return context;
};

// 3. Creamos el Proveedor del Contexto
export const PetProvider = ({ children }) => {
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPets = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setPets([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/pets`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de mascotas.');
      }
      const petsData = await response.json();
      setPets(Array.isArray(petsData) ? petsData : []);
    } catch (err) {
      setError(err.message);
      setPets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPets = () => {
    setPets([]);
  };

  const value = {
    pets,
    isLoading,
    error,
    fetchPets,
    clearPets,
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};