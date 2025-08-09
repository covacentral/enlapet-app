// frontend/src/AppointmentsTab.jsx
// Versión 1.1: Conectado a la API para mostrar citas reales.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AppointmentCard from './AppointmentCard'; // 1. Importamos la tarjeta de cita

import styles from './AppointmentsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AppointmentsTab({ userProfile }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Lógica real para buscar las citas del usuario desde la API
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado.");
        const idToken = await user.getIdToken();
        
        const response = await fetch(`${API_URL}/api/appointments`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (!response.ok) throw new Error("No se pudieron cargar las citas.");

        const data = await response.json();
        setAppointments(data);

    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);
  
  const isVet = userProfile?.verification?.status === 'verified' && userProfile?.verification?.type === 'vet';
  const userType = isVet ? 'vet' : 'user';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={sharedStyles.tabTitle} style={{ marginBottom: 0 }}>
            {isVet ? 'Mi Agenda de Citas' : 'Mis Citas'}
        </h2>
      </div>

      <div className={styles.appointmentList}>
        {isLoading && <LoadingComponent text="Cargando citas..." />}
        {error && <p className={sharedStyles.responseMessageError}>{error}</p>}
        
        {!isLoading && !error && appointments.length === 0 && (
            <div className={sharedStyles.emptyStateMessage}>
                <h3>No tienes próximas citas.</h3>
                <p>
                    {isVet 
                        ? 'Las citas que te soliciten tus pacientes aparecerán aquí.' 
                        : 'Agenda una nueva consulta desde el perfil de un veterinario verificado.'
                    }
                </p>
            </div>
        )}

        {/* 3. Renderizamos las tarjetas de citas reales */}
        {!isLoading && appointments.length > 0 && appointments.map(app => (
            <AppointmentCard 
                key={app.id} 
                appointment={app} 
                userType={userType} 
            />
        ))}
      </div>
    </div>
  );
}

export default AppointmentsTab;