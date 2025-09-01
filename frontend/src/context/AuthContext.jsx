// frontend/src/context/AuthContext.jsx
// VERSIÓN 2.0: Integra la carga de datos de UserContext y PetContext.

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useUser } from './UserContext';
import { usePets } from './PetContext'; // <-- 1. Importamos el hook de PetContext

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchUserProfile, clearUserProfile } = useUser();
  const { fetchPets, clearPets } = usePets(); // <-- 2. Obtenemos las funciones de PetContext

  const fetchAllUserData = async () => {
    await Promise.all([fetchUserProfile(), fetchPets()]);
  };

  const clearAllUserData = () => {
    clearUserProfile();
    clearPets();
  };

  const signUp = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();

    await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ name, email, password }),
    });

    await fetchAllUserData(); // <-- 3. Cargamos todos los datos del usuario
    return userCredential;
  };

  const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await fetchAllUserData(); // <-- 3. Cargamos todos los datos del usuario
    return userCredential;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    });

    await fetchAllUserData(); // <-- 3. Cargamos todos los datos del usuario
    return result;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    clearAllUserData(); // <-- 4. Limpiamos todos los datos del usuario
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchAllUserData();
      } else {
        clearAllUserData();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};