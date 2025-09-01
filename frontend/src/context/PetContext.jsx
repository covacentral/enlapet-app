// frontend/src/context/PetContext.jsx
// VERSIÓN CORREGIDA: Reacciona a los cambios de AuthContext para un flujo de datos unidireccional.

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext'; // <-- 1. Importamos useAuth para escuchar cambios.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  const { currentUser } = useAuth(); // <-- 2. Obtenemos el usuario actual de AuthContext.

  const fetchPets = useCallback(async () => {
    if (!currentUser) return; // No hacer nada si no hay usuario.

    setIsLoading(true);
    setError(null);
    try {
      const idToken = await currentUser.getIdToken();
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
  }, [currentUser]); // <-- El currentUser es ahora la dependencia.

  const clearPets = () => {
    setPets([]);
  };

  // 3. Este useEffect reacciona a los cambios en currentUser.
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
    // Las funciones de fetch/clear ya no necesitan ser exportadas.
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
};