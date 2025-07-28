import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Asegúrate que la ruta a tu firebase.js es correcta
import api from '../services/api'; // Importamos el nuevo servicio de API
import LoadingComponent from '../LoadingComponent'; // Importamos el componente de carga

// Este es nuestro "Tablón de Anuncios Central". Gestiona el estado
// del usuario (si está logueado, sus datos, etc.) y lo hace
// disponible para toda la aplicación.
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token); // Guardamos el token para el servicio API
        const { data: profile } = await api.get('/profile'); // Usamos el servicio API para obtener el perfil
        setUser({ ...firebaseUser, ...profile });
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // onAuthStateChanged es el listener de Firebase que se dispara
    // cada vez que el estado de autenticación cambia.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      fetchUserProfile(firebaseUser);
    });

    // Limpiamos el listener cuando el componente se desmonta
    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Mientras carga el estado inicial del usuario, mostramos un loader.
  // Esto evita que se muestren vistas protegidas o incorrectas brevemente.
  if (loading) {
    return <LoadingComponent />;
  }

  // El "Provider" envuelve a sus hijos (toda la app) y les da acceso
  // al "value", que contiene el estado del usuario y la función para recargarlo.
  return (
    <AuthContext.Provider value={{ user, setUser, fetchUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
