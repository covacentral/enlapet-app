// frontend/src/VetTabs/ManageScheduleTab.jsx
// Versión 1.4: Layout vertical y funcionalidad de doble jornada.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import styles from './ManageScheduleTab.module.css';
import sharedStyles from '../shared.module.css';
import { ChevronDown, PlusCircle, XCircle } from 'lucide-react';

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

// 1. Nuevo estado inicial para soportar doble jornada
const initialScheduleState = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.key] = { 
        isActive: false, 
        isSplit: false,
        ranges: [
            { startTime: '09:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '17:00' }
        ]
    };
    return acc;
}, {});


function ManageScheduleTab() {
  const [schedule, setSchedule] = useState(initialScheduleState);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setIsFetching(true);
    setMessage('');
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado.");
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/vet/availability`, { headers: { 'Authorization': `Bearer ${idToken}` }});
        if (!response.ok) throw new Error('No se pudo cargar el horario guardado.');
        const savedSchedule = await response.json();
        if (Object.keys(savedSchedule).length > 0) {
            // Fusionamos el horario guardado con el inicial para asegurar que todos los campos existan
            const mergedSchedule = { ...initialScheduleState };
            for(const dayKey in savedSchedule) {
                mergedSchedule[dayKey] = { ...initialScheduleState[dayKey], ...savedSchedule[dayKey] };
            }
            setSchedule(mergedSchedule);
        }
    } catch (error) {
        setMessage(`Error al cargar: ${error.message}`);
    } finally {
        setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleToggleActive = (dayKey) => {
    setSchedule(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], isActive: !prev[dayKey].isActive }}));
  };
  
  // 2. Nuevas funciones para manejar la doble jornada
  const handleToggleSplit = (dayKey) => {
    setSchedule(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], isSplit: !prev[dayKey].isSplit }}));
  };

  const handleTimeChange = (dayKey, rangeIndex, field, value) => {
      const newRanges = [...schedule[dayKey].ranges];
      newRanges[rangeIndex][field] = value;
      setSchedule(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], ranges: newRanges }}));
  };

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

  if (isFetching) { return <p>Cargando configuración de horario...</p> }

  return (
    <div className={styles.scheduleEditor}>
      <div className={styles.editorHeader} onClick={() => setIsEditorOpen(!isEditorOpen)}>
        <h3>Define tus horarios de atención</h3>
        <ChevronDown className={`${styles.toggleIcon} ${isEditorOpen ? styles.open : ''}`} />
      </div>

      {isEditorOpen && (
        <div>
          <p style={{color: 'var(--text-secondary)', marginTop: 0, marginBottom: '1.5rem'}}>Define tus jornadas laborales. Puedes añadir un segundo turno para los descansos.</p>
          {DAYS_OF_WEEK.map(({ key, label }) => (
            <div key={key} className={styles.dayRow}>
              <div className={styles.dayToggle}>
                <span className={styles.dayLabel}>{label}</span>
                <div className={styles.switchContainer}>
                  <span>{schedule[key].isActive ? 'Disponible' : 'No disponible'}</span>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={schedule[key].isActive} onChange={() => handleToggleActive(key)} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
              
              {schedule[key].isActive && (
                <div className={styles.timeRanges}>
                  <div className={styles.timeInputGroup}>
                    <label>Jornada 1</label>
                    <input type="time" className={styles.timeInput} value={schedule[key].ranges[0].startTime} onChange={(e) => handleTimeChange(key, 0, 'startTime', e.target.value)} />
                    <span>-</span>
                    <input type="time" className={styles.timeInput} value={schedule[key].ranges[0].endTime} onChange={(e) => handleTimeChange(key, 0, 'endTime', e.target.value)} />
                  </div>
                  
                  {schedule[key].isSplit ? (
                    <div className={styles.timeInputGroup}>
                      <label>Jornada 2</label>
                      <input type="time" className={styles.timeInput} value={schedule[key].ranges[1].startTime} onChange={(e) => handleTimeChange(key, 1, 'startTime', e.target.value)} />
                      <span>-</span>
                      <input type="time" className={styles.timeInput} value={schedule[key].ranges[1].endTime} onChange={(e) => handleTimeChange(key, 1, 'endTime', e.target.value)} />
                       <button onClick={() => handleToggleSplit(key)} className={sharedStyles.linkButton} style={{padding: '0 5px'}}><XCircle size={16}/></button>
                    </div>
                  ) : (
                    <button onClick={() => handleToggleSplit(key)} className={sharedStyles.linkButton}><PlusCircle size={16}/> Añadir jornada</button>
                  )}
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
      )}
    </div>
  );
}

export default ManageScheduleTab;