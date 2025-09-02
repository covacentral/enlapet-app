// frontend/src/context/AuthContext.jsx
// VERSIÓN 3.0: Refactorizado para usar la capa de API (auth.api.js).

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
// 1. Importamos las funciones del servicio de API de autenticación.
import { registerUserInBackend, authenticateWithGoogleBackend } from '../api/auth.api';

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

  const signUp = async (name, email, password) => {
    // La creación en Firebase Auth se mantiene aquí.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Reemplazamos el fetch con la llamada al servicio de API.
    // El token se adjunta automáticamente por el interceptor de Axios.
    await registerUserInBackend({ name, email, password });

    return userCredential;
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    
    // 3. Reemplazamos el fetch con la llamada al servicio de API.
    await authenticateWithGoogleBackend(idToken);
    
    return result;
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
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