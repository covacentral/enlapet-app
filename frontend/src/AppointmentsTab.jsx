// frontend/src/AppointmentsTab.jsx
// (NUEVO) Página para que usuarios y veterinarios vean sus citas.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';

import styles from './AppointmentsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Por ahora, este es un componente de marcador de posición (placeholder).
// Más adelante lo llenaremos con la lógica real y las tarjetas de citas.
function AppointmentsTab({ userProfile }) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // La lógica para hacer fetch a las citas se añadirá en un paso posterior.
  useEffect(() => {
    // Simulamos una carga para ver el estado inicial.
    setTimeout(() => {
        setIsLoading(false);
        // Aquí iría la llamada a: GET /api/appointments
    }, 1000);
  }, []);
  
  const isVet = userProfile?.verification?.type === 'vet';

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

        {/* Aquí es donde se renderizarán las tarjetas de citas en el futuro */}
        {appointments.map(app => (
            <div key={app.id}>Cita para {app.petName}</div>
        ))}
      </div>
    </div>
  );
}

export default AppointmentsTab;