// frontend/src/AppointmentsTab.jsx
// Versión 1.2: Pasa la función de actualización a las tarjetas de cita.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AppointmentCard from './AppointmentCard';

import styles from './AppointmentsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AppointmentsTab({ userProfile }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    // No establecemos isLoading a true aquí para un refresco más suave
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
        setIsLoading(false); // Solo se quita la carga inicial una vez
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
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

        {/* --- LÍNEA MODIFICADA --- */}
        {!isLoading && appointments.length > 0 && appointments.map(app => (
            <AppointmentCard 
                key={app.id} 
                appointment={app} 
                userType={userType} 
                onUpdate={fetchAppointments}
            />
        ))}
      </div>
    </div>
  );
}

export default AppointmentsTab;