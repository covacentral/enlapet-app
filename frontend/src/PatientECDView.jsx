// frontend/src/PatientECDView.jsx
// (NUEVO) Vista detallada del Expediente Clínico Digital de un paciente.

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Stethoscope, HeartPulse, Shield, Beaker, Plus } from 'lucide-react';
import LoadingComponent from './LoadingComponent';
import styles from './PatientECDView.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Sub-componente para renderizar una tarjeta de consulta (SOAP)
const ConsultationCard = ({ record }) => (
    <div className={styles.recordCard}>
        <div className={styles.recordHeader}>
            <h4>Consulta General</h4>
            <span>{format(new Date(record.date), 'd \'de\' MMMM, yyyy', { locale: es })}</span>
        </div>
        <div className={styles.recordBody}>
            <p><strong>Subjetivo:</strong> {record.subjective}</p>
            <p><strong>Apreciación (Diagnóstico):</strong> {record.appreciation}</p>
            <p><strong>Plan:</strong> {record.plan}</p>
            <div className={styles.vitals}>
                <span>Peso: <strong>{record.objective.weightKg} kg</strong></span>
                <span>Temp: <strong>{record.objective.temperatureC}°C</strong></span>
            </div>
        </div>
        <div className={styles.recordFooter}>
            Registrado por: {record.author.authorName} ({record.author.authorType})
        </div>
    </div>
);

function PatientECDView() {
    const { petId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('consultations');

    // Simulación de datos hasta conectar con el modal de creación
    const healthRecord = patient?.healthRecord || { consultations: [], vaccines: [], deworming: [], exams: [] };

    useEffect(() => {
        // En una implementación futura, aquí se haría un fetch del paciente por su ID.
        // Por ahora, para mantener la funcionalidad, simularemos la carga.
        const fetchPatientData = async () => {
            setIsLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) throw new Error("Usuario no autenticado.");
                const idToken = await user.getIdToken();
                // Esta es una simulación. Idealmente, tendríamos un endpoint GET /api/vet/patient/:petId
                // Por ahora, obtendremos todos los pacientes y filtraremos.
                const response = await fetch(`${API_URL}/api/vet/patients`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });
                if (!response.ok) throw new Error('No se pudo cargar la información del paciente.');
                const allPatients = await response.json();
                const currentPatient = allPatients.find(p => p.id === petId);
                if (!currentPatient) throw new Error('Paciente no encontrado o no tienes acceso.');
                setPatient(currentPatient);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPatientData();
    }, [petId]);
    
    if (isLoading) return <LoadingComponent text="Cargando expediente..." />;
    if (error) return <div className={sharedStyles.responseMessageError} style={{padding: '2rem'}}>{error}</div>;
    if (!patient) return null;

    return (
        <div className={styles.pageContainer}>
            <button onClick={() => navigate(-1)} className={styles.backButton}><ArrowLeft size={20}/> Volver al Panel</button>
            <header className={styles.header}>
                <img src={patient.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={patient.name} className={styles.petImage}/>
                <div className={styles.petDetails}>
                    <h1>{patient.name}</h1>
                    <p>{patient.breed} - {patient.healthRecord?.gender}</p>
                    <Link to={`/pet/${patient.id}`} className={sharedStyles.linkButton}>Ver Perfil Público</Link>
                </div>
            </header>

            <div className={sharedStyles.modalTabs}>
                <button className={`${sharedStyles.modalTabButton} ${activeTab === 'consultations' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('consultations')}><Stethoscope size={16}/> Consultas</button>
                <button className={`${sharedStyles.modalTabButton} ${activeTab === 'vaccines' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('vaccines')}><Shield size={16}/> Vacunación</button>
                <button className={`${sharedStyles.modalTabButton} ${activeTab === 'deworming' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('deworming')}><HeartPulse size={16}/> Desparasitación</button>
                <button className={`${sharedStyles.modalTabButton} ${activeTab === 'exams' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('exams')}><Beaker size={16}/> Exámenes</button>
            </div>

            <main className={styles.content}>
                <div className={styles.tabHeader}>
                    <h3>Historial de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
                    <button className={`${sharedStyles.button} ${sharedStyles.primary}`}><Plus size={16}/> Nuevo Registro</button>
                </div>

                {activeTab === 'consultations' && (
                    <div className={styles.recordList}>
                        {healthRecord.consultations.length > 0 ? healthRecord.consultations.map(c => <ConsultationCard key={c.id} record={c}/>) : <p>No hay consultas registradas.</p>}
                    </div>
                )}
                 {/* Aquí irían los demás paneles para las otras pestañas */}
            </main>
        </div>
    );
}

export default PatientECDView;