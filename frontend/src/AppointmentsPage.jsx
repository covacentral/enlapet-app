// frontend/src/AppointmentsPage.jsx
// (NUEVO) Página para que dueños y veterinarios gestionen sus citas.

import { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Check, X, Clock, PlayCircle } from 'lucide-react';
import LoadingComponent from './LoadingComponent';
import styles from './AppointmentsPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Tarjeta de Cita ---
const AppointmentCard = ({ appointment, isVet, onUpdate }) => {
    const { id, petName, ownerName, vetName, appointmentDate, reason, status } = appointment;
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/appointments/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('No se pudo actualizar la cita.');
            onUpdate(); // Refresca la lista de citas
        } catch (error) {
            console.error(error);
            // Aquí se podría mostrar un mensaje de error al usuario.
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartSession = async () => {
        setIsLoading(true);
         try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/appointments/${id}/start-session`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error('No se pudo iniciar la sesión.');
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const formattedDate = format(new Date(appointmentDate), "eeee, d 'de' MMMM, yyyy", { locale: es });
    const formattedTime = format(new Date(appointmentDate), "h:mm a", { locale: es });

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h4>{isVet ? `Cita con ${petName}` : `Cita para ${petName}`}</h4>
                <span className={`${styles.statusBadge} ${styles[status]}`}>{status}</span>
            </div>
            <div className={styles.cardBody}>
                <p><strong>{isVet ? 'Responsable' : 'Veterinario'}:</strong> {isVet ? ownerName : vetName}</p>
                <p><strong>Fecha:</strong> {formattedDate}</p>
                <p><strong>Hora:</strong> {formattedTime}</p>
                <p><strong>Motivo:</strong> {reason}</p>
            </div>
            {isVet && status === 'pending' && (
                <div className={styles.cardActions}>
                    <button onClick={() => handleStatusUpdate('cancelled_by_vet')} className={`${sharedStyles.button} ${sharedStyles.danger}`} disabled={isLoading}><X size={16}/> Rechazar</button>
                    <button onClick={() => handleStatusUpdate('confirmed')} className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isLoading}><Check size={16}/> Confirmar</button>
                </div>
            )}
            {isVet && status === 'confirmed' && !appointment.session?.isActive && (
                 <div className={styles.cardActions}>
                    <button onClick={handleStartSession} className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isLoading}><PlayCircle size={16}/> Iniciar Consulta</button>
                </div>
            )}
            {appointment.session?.isActive && (
                <div className={styles.sessionActive}>
                    <Clock size={16}/> Sesión clínica activa
                </div>
            )}
        </div>
    );
};


function AppointmentsPage({ userProfile }) {
    const [view, setView] = useState('upcoming');
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const isVet = userProfile?.verification?.type === 'vet';

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/appointments?view=${view}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar las citas.');
            const data = await response.json();
            setAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [view]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={sharedStyles.tabTitle}>Mis Citas</h2>
            </div>
            <div className={sharedStyles.modalTabs}>
                <button className={`${sharedStyles.modalTabButton} ${view === 'upcoming' ? sharedStyles.active : ''}`} onClick={() => setView('upcoming')}>Próximas</button>
                <button className={`${sharedStyles.modalTabButton} ${view === 'past' ? sharedStyles.active : ''}`} onClick={() => setView('past')}>Historial</button>
            </div>

            <div className={styles.content}>
                {isLoading ? <LoadingComponent text="Cargando citas..." /> :
                 error ? <p className={sharedStyles.responseMessageError}>{error}</p> :
                 appointments.length > 0 ? (
                     <div className={styles.grid}>
                         {appointments.map(app => <AppointmentCard key={app.id} appointment={app} isVet={isVet} onUpdate={fetchAppointments} />)}
                     </div>
                 ) : (
                    <p className={sharedStyles.emptyStateMessage}>No tienes citas en esta sección.</p>
                 )
                }
            </div>
        </div>
    );
}

export default AppointmentsPage;