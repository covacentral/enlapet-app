// frontend/src/AppointmentsTab.jsx
// Versión 1.3: Centraliza la lógica de actualización de estado.

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

  const fetchAppointments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
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
        if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(true);
  }, [fetchAppointments]);
  
  // --- 1. [NUEVO] Función centralizada para actualizar el estado ---
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado.");
        const idToken = await user.getIdToken();

        const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error((await response.json()).message);
        
        // Si la API responde con éxito, refrescamos la lista de citas sin mostrar el spinner de carga
        fetchAppointments(false);

    } catch (err) {
        // En un futuro, podríamos mostrar este error de forma más elegante
        console.error("Error al actualizar la cita:", err);
        alert(`Error: ${err.message}`);
    }
  };

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

        {!isLoading && appointments.length > 0 && appointments.map(app => (
            <AppointmentCard 
                key={app.id} 
                appointment={app} 
                userType={userType} 
                // 2. Pasamos la nueva función como prop
                onStatusUpdate={handleStatusUpdate}
            />
        ))}
      </div>
    </div>
  );
}

export default AppointmentsTab;