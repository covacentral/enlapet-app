// frontend/src/VetDashboardPage.jsx
// Versión 2.1 - IMPLEMENTACIÓN DE MODAL DE EDICIÓN
// TAREA: Se abre el PetEditModal en "modo veterinario" al hacer clic en un paciente.

import { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import { Search, Send, CheckCircle } from 'lucide-react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';
import LoadingComponent from './LoadingComponent';
import PetEditModal from './PetEditModal'; // <-- 1. Importamos el modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Componente PetSearchResult (sin cambios)
const PetSearchResult = ({ pet }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleLinkRequest = async () => {
    setIsLoading(true);
    setMessage('');
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
      setMessage(data.message);
      setRequestSent(true);
    } catch (error) {
      setMessage(error.message);
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

// Componente PatientCard (sin cambios)
const PatientCard = ({ patient, onClick }) => {
    return (
        <div className={styles.patientCard} onClick={() => onClick(patient)}>
            <img src={patient.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={patient.name} className={styles.patientImage}/>
            <div className={styles.petInfo}><h4>{patient.name}</h4><p>EPID: {patient.epid}</p></div>
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

  // --- 2. Estados para manejar el modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const user = auth.currentUser; // Obtenemos el usuario actual para pasarlo al modal

  const fetchPatients = useCallback(async () => {
    setIsLoadingPatients(true);
    setPatientMessage('');
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/vet/patients`, { headers: { 'Authorization': `Bearer ${idToken}` } });
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
    if (user) fetchPatients();
  }, [user, fetchPatients]);

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
  
  // --- 3. Lógica para abrir el modal ---
  const handlePatientCardClick = (patientData) => {
      setSelectedPet(patientData);
      setIsModalOpen(true);
  }
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedPet(null);
  }

  return (
    <>
      {/* --- 4. Renderizado del modal --- */}
      {isModalOpen && (
        <PetEditModal 
            pet={selectedPet}
            user={user}
            onClose={handleCloseModal}
            onUpdate={fetchPatients} // Al actualizar, refrescamos la lista de pacientes
            isVetMode={true} // ¡La clave! Activamos el "modo veterinario"
        />
      )}

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
          <h3>Mis Pacientes</h3>
          {isLoadingPatients ? <LoadingComponent text="Cargando pacientes..." /> : 
           patientMessage ? <p className={sharedStyles.responseMessageError}>{patientMessage}</p> : 
           patients.length > 0 ? (
            <div className={styles.patientsGrid}>
                {patients.map(p => <PatientCard key={p.id} patient={p} onClick={handlePatientCardClick} />)}
            </div>
           ) : (<p className={sharedStyles.emptyStateMessage}>Aún no tienes pacientes vinculados.</p>)}
        </div>
      </div>
    </>
  );
}

export default VetDashboardPage;