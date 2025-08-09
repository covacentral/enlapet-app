// frontend/src/AppointmentModal.jsx
// (NUEVO) Modal para que los usuarios agenden una nueva cita.

import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { X } from 'lucide-react';
import styles from './AppointmentModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AppointmentModal({ vetProfile, pets, onClose, onAppointmentRequested }) {
  const [selectedPetId, setSelectedPetId] = useState(pets.length > 0 ? pets[0].id : '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Lógica para buscar horarios disponibles (a conectar en un futuro paso)
  useEffect(() => {
    if (selectedDate && vetProfile) {
      setIsLoadingSlots(true);
      // Simulación de llamada a la API
      console.log(`Buscando horarios para ${vetProfile.id} en la fecha ${selectedDate}`);
      setTimeout(() => {
        // Datos de ejemplo
        setAvailableSlots(['09:00', '09:30', '11:00', '14:00', '14:30']);
        setIsLoadingSlots(false);
      }, 1000);
    }
  }, [selectedDate, vetProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPetId || !selectedDate || !selectedSlot || !reason) {
      setMessage('Por favor, completa todos los campos.');
      return;
    }
    // Lógica de envío a /api/appointments/request
    console.log('Enviando solicitud de cita...');
    onClose(); // Cerramos el modal por ahora
  };

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>Agendar Cita con {vetProfile.name}</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={sharedStyles.formGroup}>
            <label>1. ¿Para cuál mascota es la cita?</label>
            <div className={styles.petSelector}>
              {pets.map(pet => (
                <div 
                  key={pet.id} 
                  className={`${styles.petBubble} ${selectedPetId === pet.id ? styles.selected : ''}`}
                  onClick={() => setSelectedPetId(pet.id)}
                >
                  <img src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
                  <span>{pet.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={sharedStyles.formGroup}>
            <label htmlFor="appointmentDate">2. Selecciona la fecha</label>
            <input 
              type="date"
              id="appointmentDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]} // No se pueden agendar citas en el pasado
            />
          </div>

          <div className={sharedStyles.formGroup}>
            <label>3. Elige un horario disponible</label>
            {isLoadingSlots ? <p className={styles.loadingSlots}>Buscando horarios...</p> : (
              <div className={styles.timeSlotsGrid}>
                {availableSlots.length > 0 ? availableSlots.map(slot => (
                  <button 
                    type="button" 
                    key={slot} 
                    className={`${styles.timeSlotButton} ${selectedSlot === slot ? styles.selected : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                )) : <p>No hay horarios disponibles para esta fecha.</p>}
              </div>
            )}
          </div>

          <div className={sharedStyles.formGroup}>
            <label htmlFor="reason">4. Motivo de la consulta</label>
            <input 
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Vacunación anual"
              required
            />
          </div>
          
          <div className={sharedStyles.modalFooter}>
            {message && <p className={sharedStyles.responseMessageError}>{message}</p>}
            <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isSubmitting || isLoadingSlots}>
              {isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentModal;