// frontend/src/AppointmentModal.jsx
// (NUEVO) Modal para que los dueños de mascotas soliciten una cita.

import { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { X } from 'lucide-react';
import { format, addDays, setHours, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

import styles from './AppointmentModal.module.css';
import sharedStyles from './shared.module.css';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Lógica para generar los horarios disponibles ---
const generateTimeSlots = (vetSettings, daysToShow = 7) => {
    const slots = [];
    const now = new Date();
    const duration = vetSettings.consultationDurationMinutes || 30;

    for (let i = 0; i < daysToShow; i++) {
        const date = startOfDay(addDays(now, i));
        const daySlots = [];
        
        // Simulación de horario de 9 AM a 5 PM. En el futuro, esto leerá vetSettings.workHours
        let currentTime = setHours(date, 9);
        const endTime = setHours(date, 17);

        while (currentTime < endTime) {
            if (currentTime > now) { // Solo mostrar horarios futuros
                daySlots.push(new Date(currentTime));
            }
            currentTime.setMinutes(currentTime.getMinutes() + duration);
        }
        if (daySlots.length > 0) {
            slots.push({ date: format(date, 'eeee d MMM', { locale: es }), slots: daySlots });
        }
    }
    return slots;
};


function AppointmentModal({ onClose, vetProfile }) {
    const [userPets, setUserPets] = useState([]);
    const [isLoadingPets, setIsLoadingPets] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (vetProfile.vetSettings) {
            const slots = generateTimeSlots(vetProfile.vetSettings);
            setAvailableSlots(slots);
        }

        const fetchUserPets = async () => {
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("No autenticado.");
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/api/pets`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) throw new Error("No se pudieron cargar tus mascotas.");
                const pets = await response.json();
                setUserPets(pets);
                if (pets.length > 0) {
                    setSelectedPetId(pets[0].id);
                }
            } catch (error) {
                setMessage(error.message);
            } finally {
                setIsLoadingPets(false);
            }
        };

        fetchUserPets();
    }, [vetProfile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPetId || !selectedSlot) {
            setMessage('Por favor, selecciona una mascota y un horario.');
            return;
        }
        setIsLoading(true);
        setMessage('Enviando solicitud...');
        try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const payload = {
                vetId: vetProfile.id,
                petId: selectedPetId,
                appointmentDate: selectedSlot.toISOString(),
                reason: reason || "Consulta general"
            };
            const response = await fetch(`${API_URL}/api/appointments/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            setMessage('¡Solicitud de cita enviada!');
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={sharedStyles.modalBackdrop} onClick={onClose}>
            <div className={styles.content} onClick={e => e.stopPropagation()}>
                <div className={sharedStyles.modalHeader}>
                    <h2>Agendar Cita con {vetProfile.name}</h2>
                    <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>
                {isLoadingPets ? <LoadingComponent text="Cargando..." /> : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="petId">¿Para cuál mascota es la cita?</label>
                            <select id="petId" value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} required>
                                {userPets.length > 0 ? (
                                    userPets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)
                                ) : (
                                    <option value="" disabled>No tienes mascotas registradas.</option>
                                )}
                            </select>
                        </div>

                        <div className={sharedStyles.formGroup}>
                            <label>Selecciona un Horario</label>
                            <div className={styles.slotsContainer}>
                                {availableSlots.map(day => (
                                    <div key={day.date} className={styles.dayGroup}>
                                        <h4 className={styles.dayTitle}>{day.date}</h4>
                                        <div className={styles.timeSlots}>
                                            {day.slots.map(slot => (
                                                <button 
                                                    type="button" 
                                                    key={slot.toISOString()}
                                                    className={`${styles.slotButton} ${selectedSlot?.getTime() === slot.getTime() ? styles.selected : ''}`}
                                                    onClick={() => setSelectedSlot(slot)}
                                                >
                                                    {format(slot, 'h:mm a')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="reason">Motivo de la consulta</label>
                            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows="3" placeholder="Ej: Chequeo general, vacuna pendiente..."></textarea>
                        </div>
                        
                        <div className={sharedStyles.modalFooter}>
                            {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
                            <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isLoading || !selectedPetId || !selectedSlot}>
                                {isLoading ? 'Enviando...' : 'Solicitar Cita'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default AppointmentModal;