// frontend/src/AppointmentCard.jsx
// Versión 1.1: Lógica de gestión de citas implementada.

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { auth } from './firebase'; // Importamos auth para el token
import styles from './AppointmentCard.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// El componente ahora recibe una función onUpdate para refrescar la lista
function AppointmentCard({ appointment, userType, onUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const appointmentDate = new Date(appointment.appointmentDate);
  
  const month = format(appointmentDate, 'MMM', { locale: es });
  const day = format(appointmentDate, 'd');
  const time = format(appointmentDate, 'p', { locale: es });

  const statusStyles = {
    pending: styles.pending,
    confirmed: styles.confirmed,
    cancelled_by_user: styles.cancelled,
    cancelled_by_vet: styles.cancelled,
    completed: styles.completed,
    no_show: styles.cancelled,
  };

  const statusText = {
    pending: 'Pendiente de Confirmación',
    confirmed: 'Confirmada',
    cancelled_by_user: 'Cancelada por Usuario',
    cancelled_by_vet: 'Cancelada por Veterinario',
    completed: 'Completada',
    no_show: 'No Asistió',
  };

  // NUEVA FUNCIÓN para manejar la actualización de estado
  const handleStatusUpdate = async (newStatus) => {
    setIsLoading(true);
    setMessage('');

    if (newStatus.startsWith('cancelled') && !window.confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
        setIsLoading(false);
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado.");
        const idToken = await user.getIdToken();

        const response = await fetch(`${API_URL}/api/appointments/${appointment.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // Si la API responde con éxito, llamamos a onUpdate para refrescar la lista de citas
        onUpdate();

    } catch (error) {
        setMessage(error.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  // Lógica para renderizar los botones de acción correctos
  const renderActions = () => {
    if (appointment.status.startsWith('cancelled') || appointment.status === 'completed' || appointment.status === 'no_show') {
      return null; // No hay acciones para citas finalizadas o canceladas
    }

    if (userType === 'vet' && appointment.status === 'pending') {
      return (
        <>
          <button className={`${sharedStyles.button} ${sharedStyles.danger}`} onClick={() => handleStatusUpdate('cancelled_by_vet')} disabled={isLoading}>Rechazar</button>
          <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={() => handleStatusUpdate('confirmed')} disabled={isLoading}>Confirmar</button>
        </>
      );
    }

    if (appointment.status === 'pending' || appointment.status === 'confirmed') {
        const cancelStatus = userType === 'vet' ? 'cancelled_by_vet' : 'cancelled_by_user';
        return (
            <button className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={() => handleStatusUpdate(cancelStatus)} disabled={isLoading}>
                {isLoading ? '...' : 'Cancelar Cita'}
            </button>
        );
    }
    
    return null;
  };

  return (
    <div className={`${styles.card} ${statusStyles[appointment.status] || ''}`}>
      <div className={styles.dateTime}>
        <span className={styles.month}>{month}</span>
        <span className={styles.day}>{day}</span>
        <span className={styles.time}>{time}</span>
      </div>

      <div className={styles.details}>
        <h4 className={styles.reason}>{appointment.reason}</h4>
        <p className={styles.attendees}>
          {userType === 'vet'
            ? <>Paciente: <strong>{appointment.petName}</strong> (Dueño: {appointment.ownerName})</>
            : <>Veterinario(a): <strong>{appointment.vetName}</strong> (Paciente: {appointment.petName})</>
          }
        </p>
         <small>Estado: {statusText[appointment.status]}</small>
         {message && <p className={sharedStyles.responseMessageError} style={{fontSize: '0.8rem', marginTop: '8px'}}>{message}</p>}
      </div>

      <div className={styles.actions}>
        {renderActions()}
      </div>
    </div>
  );
}

export default AppointmentCard;