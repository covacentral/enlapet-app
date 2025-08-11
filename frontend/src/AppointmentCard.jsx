// frontend/src/AppointmentCard.jsx
// Versión 1.3: Ajusta la estructura JSX para el nuevo layout responsivo.

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './AppointmentCard.module.css';
import sharedStyles from './shared.module.css';

function AppointmentCard({ appointment, userType, onStatusUpdate }) {
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

  const renderActions = () => {
    if (appointment.status.startsWith('cancelled') || appointment.status === 'completed' || appointment.status === 'no_show') {
      return null;
    }

    if (userType === 'vet') {
      if (appointment.status === 'pending') {
        return (
          <div className={styles.actions}>
            <button className={`${sharedStyles.button} ${sharedStyles.danger}`} onClick={() => onStatusUpdate(appointment.id, 'cancelled_by_vet')}>Rechazar</button>
            <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={() => onStatusUpdate(appointment.id, 'confirmed')}>Confirmar</button>
          </div>
        );
      }
      if (appointment.status === 'confirmed') {
        return (
          <div className={styles.actions}>
            <button className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={() => onStatusUpdate(appointment.id, 'cancelled_by_vet')}>Cancelar Cita</button>
          </div>
        );
      }
    }

    if (userType === 'user') {
      if (appointment.status === 'pending' || appointment.status === 'confirmed') {
        return (
          <div className={styles.actions}>
            <button className={`${sharedStyles.button} ${sharedStyles.secondary}`} onClick={() => onStatusUpdate(appointment.id, 'cancelled_by_user')}>Cancelar Cita</button>
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <div className={`${styles.card} ${statusStyles[appointment.status] || ''}`}>
      {/* --- 1. [NUEVO] Contenedor para la información principal --- */}
      <div className={styles.mainContent}>
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
        </div>
      </div>
      
      {/* --- 2. Los botones de acción ahora son un hermano del contenido principal --- */}
      {renderActions()}
    </div>
  );
}

export default AppointmentCard;