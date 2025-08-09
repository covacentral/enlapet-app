// frontend/src/AppointmentCard.jsx
// (NUEVO) Componente para mostrar una tarjeta de cita individual.

import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './AppointmentCard.module.css';
import sharedStyles from './shared.module.css';

function AppointmentCard({ appointment, userType }) {
  const appointmentDate = new Date(appointment.appointmentDate);

  // Formateo de fechas con date-fns
  const month = format(appointmentDate, 'MMM', { locale: es });
  const day = format(appointmentDate, 'd');
  const time = format(appointmentDate, 'p', { locale: es });

  const statusStyles = {
    pending: styles.pending,
    confirmed: styles.confirmed,
    cancelled_by_user: styles.cancelled,
    cancelled_by_vet: styles.cancelled,
    completed: styles.completed,
    no_show: styles.cancelled
  };

  const statusText = {
    pending: 'Pendiente de Confirmación',
    confirmed: 'Confirmada',
    cancelled_by_user: 'Cancelada por Usuario',
    cancelled_by_vet: 'Cancelada por Veterinario',
    completed: 'Completada',
    no_show: 'No Asistió'
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
      </div>

      <div className={styles.actions}>
        {/* Lógica de botones condicionales irá aquí */}
        {userType === 'vet' && appointment.status === 'pending' && (
            <>
                <button className={`${sharedStyles.button} ${sharedStyles.danger}`}>Rechazar</button>
                <button className={`${sharedStyles.button} ${sharedStyles.primary}`}>Confirmar</button>
            </>
        )}
         {appointment.status === 'pending' || appointment.status === 'confirmed' ? (
             <button className={`${sharedStyles.button} ${sharedStyles.secondary}`}>Cancelar Cita</button>
         ) : null}
      </div>
    </div>
  );
}

export default AppointmentCard;