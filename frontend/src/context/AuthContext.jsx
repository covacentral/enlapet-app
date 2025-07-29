import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';
import LoadingComponent from '../LoadingComponent';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (firebaseUser) => {
    console.log('[AuthContext] Iniciando fetchUserProfile...');
    if (firebaseUser) {
      try {
        console.log('[AuthContext] Usuario de Firebase encontrado. Obteniendo token...');
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token);
        
        console.log('[AuthContext] Token obtenido. Solicitando perfil a /api/profile...');
        const response = await api.get('/profile');
        
        // --- LOG DE DEPURACIÓN CRÍTICO ---
        console.log('[AuthContext] Respuesta de /api/profile recibida:', response);

        if (!response || !response.data) {
            throw new Error("La respuesta de la API no tiene el formato esperado o está vacía.");
        }

        const profile = response.data;
        console.log('[AuthContext] Perfil obtenido:', profile);
        
        setUser({ ...firebaseUser, ...profile });
        console.log('[AuthContext] Estado del usuario actualizado en el contexto.');

      } catch (error) {
        // --- LOG DE ERROR CRÍTICO ---
        // Esto nos mostrará el error exacto en la consola del navegador.
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('[AuthContext] ERROR FATAL al obtener el perfil del usuario:', error);
        if (error.response) {
            console.error('[AuthContext] Datos del error de la API:', error.response.data);
            console.error('[AuthContext] Estado del error de la API:', error.response.status);
        }
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      console.log('[AuthContext] No se encontró usuario de Firebase. Limpiando sesión.');
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
    console.log('[AuthContext] Carga finalizada.');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      fetchUserProfile(firebaseUser);
    });
    return () => unsubscribe();
  }, [fetchUserProfile]);

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, fetchUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
