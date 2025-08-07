// frontend/src/VetDashboardPage.jsx
// Versión 3.1 - Dashboard Avanzado con Navegación a ECD
// TAREA: Se implementan los filtros por estado y se reemplaza el modal por la navegación a la vista de ECD.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { Search, Send, CheckCircle, PawPrint, Activity, Eye, Check } from 'lucide-react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';
import LoadingComponent from './LoadingComponent';
// PetEditModal ya no se importa ni se usa en esta página.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PetSearchResult = ({ pet }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleLinkRequest = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/vet/request-link/${pet.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setRequestSent(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.petResultCard}>
      <img src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={pet.name} className={styles.petImage}/>
      <div className={styles.petInfo}><h4>{pet.name}</h4><p>{pet.breed || 'Raza no especificada'}</p></div>
      <div style={{ marginLeft: 'auto' }}>
        {requestSent ? (<p style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-green)'}}><CheckCircle size={20}/> Solicitud Enviada</p>) : 
        (<button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={handleLinkRequest} disabled={isLoading}><Send size={16} /> {isLoading ? 'Enviando...' : 'Solicitar Vínculo'}</button>)}
      </div>
    </div>
  );
};

const PatientStatusBadge = ({ status }) => {
    const statusMap = {
        active: { text: 'Activo', icon: <Activity size={14} />, className: styles.statusActive },
        observation: { text: 'En Observación', icon: <Eye size={14} />, className: styles.statusObservation },
        discharged: { text: 'De Alta', icon: <Check size={14} />, className: styles.statusDischarged }
    };
    const currentStatus = statusMap[status] || { text: 'Desconocido', icon: <PawPrint size={14}/>, className: '' };
    return <div className={`${styles.statusBadge} ${currentStatus.className}`}>{currentStatus.icon} {currentStatus.text}</div>;
}

const PatientCard = ({ patient }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(`/dashboard/vet-panel/patient/${patient.id}`);
    }

    return (
        <div className={styles.patientCard} onClick={handleClick}>
            <img src={patient.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={patient.name} className={styles.patientImage}/>
            <div className={styles.petInfo}>
                <h4>{patient.name}</h4>
                <p>EPID: {patient.epid}</p>
            </div>
            <PatientStatusBadge status={patient.patientStatus} />
        </div>
    );
}

function VetDashboardPage() {
  const [epid, setEpid] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [patients, setPatients] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [patientMessage, setPatientMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const user = auth.currentUser;

  const fetchPatients = useCallback(async (filter) => {
    setIsLoadingPatients(true);
    setPatientMessage('');
    try {
        const idToken = await user.getIdToken();
        const url = `${API_URL}/api/vet/patients?status=${filter}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (!response.ok) throw new Error((await response.json()).message);
        const data = await response.json();
        setPatients(data);
    } catch (error) {
        setPatientMessage(error.message);
    } finally {
        setIsLoadingPatients(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPatients(activeFilter);
  }, [user, fetchPatients, activeFilter]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!epid.trim()) return;
    setIsSearching(true);
    setSearchMessage('');
    setSearchResult(null);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/vet/find-pet/${epid.trim()}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSearchResult(data);
    } catch (error) {
      setSearchMessage(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={sharedStyles.tabTitle} style={{ marginBottom: 0 }}>Panel de Veterinario</h2>
      </div>
      <div className={styles.searchSection}>
        <h3>Buscar y Vincular Nuevo Paciente</h3>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input type="text" value={epid} onChange={(e) => setEpid(e.target.value.toUpperCase())} placeholder="Introduce el EPID de la mascota" className={styles.searchInput} maxLength="6"/>
          <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isSearching}><Search size={18}/> {isSearching ? 'Buscando...' : 'Buscar'}</button>
        </form>
        <div className={styles.resultsSection}>
            {searchMessage && <p className={sharedStyles.responseMessageError}>{searchMessage}</p>}
            {searchResult && <PetSearchResult pet={searchResult} />}
        </div>
      </div>
      <div className={styles.patientsSection}>
        <div className={styles.patientsHeader}>
          <h3>Mis Pacientes</h3>
          <div className={styles.filterGroup}>
              <button onClick={() => setActiveFilter('active')} className={activeFilter === 'active' ? styles.activeFilter : ''}>Activos</button>
              <button onClick={() => setActiveFilter('observation')} className={activeFilter === 'observation' ? styles.activeFilter : ''}>En Observación</button>
              <button onClick={() => setActiveFilter('discharged')} className={activeFilter === 'discharged' ? styles.activeFilter : ''}>De Alta</button>
          </div>
        </div>
        {isLoadingPatients ? <LoadingComponent text="Cargando pacientes..." /> : 
         patientMessage ? <p className={sharedStyles.responseMessageError}>{patientMessage}</p> : 
         patients.length > 0 ? (
          <div className={styles.patientsGrid}>
              {patients.map(p => <PatientCard key={p.id} patient={p} />)}
          </div>
         ) : (<p className={sharedStyles.emptyStateMessage}>No tienes pacientes con el estado seleccionado.</p>)}
      </div>
    </div>
  );
}

export default VetDashboardPage;