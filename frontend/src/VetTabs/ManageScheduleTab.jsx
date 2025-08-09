// frontend/src/VetTabs/ManageScheduleTab.jsx
// (NUEVO) Componente de pestaña para que el veterinario gestione su horario.
// Versión 1.1: Conectado a la API para guardar y cargar horarios.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../firebase'; // 1. Importamos auth para obtener el token
import styles from './ManageScheduleTab.module.css';
import sharedStyles from '../shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const initialScheduleState = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = { isActive: false, startTime: '09:00', endTime: '17:00' };
    return acc;
}, {});


function ManageScheduleTab() {
  const [schedule, setSchedule] = useState(initialScheduleState);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  // 2. Función para cargar el horario guardado
  const fetchSchedule = useCallback(async () => {
    setIsFetching(true);
    // Esta funcionalidad se completará cuando creemos el endpoint GET
    console.log("Funcionalidad para cargar horario guardado pendiente.");
    setIsFetching(false);
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleToggleActive = (dayKey) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], isActive: !prev[dayKey].isActive }
    }));
  };
  
  const handleTimeChange = (dayKey, field, value) => {
      setSchedule(prev => ({
          ...prev,
          [dayKey]: { ...prev[dayKey], [field]: value }
      }));
  };

  // 3. Lógica actualizada para guardar los cambios en el backend
  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage('Guardando horario...');
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado.");
        const idToken = await user.getIdToken();

        const response = await fetch(`${API_URL}/api/vet/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
            body: JSON.stringify(schedule)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al guardar el horario.');
        
        setMessage('¡Horario guardado con éxito!');

    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
        setTimeout(() => setMessage(''), 3000);
    }
  };

  if (isFetching) {
      return <p>Cargando configuración de horario...</p>
  }

  return (
    <div className={styles.container}>
      <div className={styles.scheduleEditor}>
        <h3>Define tus horarios de atención</h3>
        <p style={{color: 'var(--text-secondary)', marginTop: '-1rem', marginBottom: '1.5rem'}}>Este horario definirá las horas disponibles que tus pacientes podrán agendar.</p>
        {DAYS_OF_WEEK.map(({ key, label }) => (
          <div key={key} className={styles.dayRow}>
            <span className={styles.dayLabel}>{label}</span>
            <div className={styles.dayToggle}>
              <label className={styles.switch}>
                <input 
                    type="checkbox" 
                    checked={schedule[key].isActive} 
                    onChange={() => handleToggleActive(key)}
                />
                <span className={styles.slider}></span>
              </label>
              <span>{schedule[key].isActive ? 'Disponible' : 'No disponible'}</span>
            </div>
            
            {schedule[key].isActive && (
              <div className={styles.timeInputs}>
                <input 
                    type="time" 
                    className={styles.timeInput}
                    value={schedule[key].startTime}
                    onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                />
                <span>-</span>
                <input 
                    type="time" 
                    className={styles.timeInput}
                    value={schedule[key].endTime}
                    onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop: '1.5rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
            {message && <p className={sharedStyles.responseMessage}>{message}</p>}
            <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Horario'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default ManageScheduleTab;