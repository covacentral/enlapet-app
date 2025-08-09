// frontend/src/VetTabs/ManageScheduleTab.jsx
// (NUEVO) Componente de pestaña para que el veterinario gestione su horario.

import React, { useState, useEffect } from 'react';
import styles from './ManageScheduleTab.module.css';
import sharedStyles from '../shared.module.css';

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

  // En el futuro, aquí se cargaría el horario guardado del veterinario.
  useEffect(() => {
    // const fetchSchedule = async () => { ... };
    // fetchSchedule();
  }, []);

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

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setMessage('Guardando horario...');
    // Lógica para enviar el horario a `POST /api/vet/availability`
    console.log("Guardando el siguiente horario:", schedule);
    setTimeout(() => { // Simulación de guardado
        setIsLoading(false);
        setMessage('¡Horario guardado con éxito!');
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.scheduleEditor}>
        <h3>Define tus horarios de atención</h3>
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
        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Horario'}
            </button>
        </div>
        {message && <p className={sharedStyles.responseMessage} style={{marginTop: '1rem', textAlign: 'right'}}>{message}</p>}
      </div>
    </div>
  );
}

export default ManageScheduleTab;