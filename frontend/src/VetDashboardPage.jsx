// frontend/src/VetDashboardPage.jsx
// (NUEVO) Panel de control para que los veterinarios gestionen a sus pacientes.

import { useState } from 'react';
import { auth } from './firebase';
import { Search, Send, CheckCircle, XCircle } from 'lucide-react';

import styles from './VetDashboardPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Componente para mostrar el resultado de la búsqueda de una mascota
const PetSearchResult = ({ pet, onLinkRequest }) => {
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
      <img
        src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'}
        alt={pet.name}
        className={styles.petImage}
      />
      <div className={styles.petInfo}>
        <h4>{pet.name}</h4>
        <p>{pet.breed || 'Raza no especificada'}</p>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {requestSent ? (
          <p style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success-green)'}}><CheckCircle size={20}/> Solicitud Enviada</p>
        ) : (
          <button 
            className={`${sharedStyles.button} ${sharedStyles.primary}`} 
            onClick={handleLinkRequest}
            disabled={isLoading}
          >
            <Send size={16} /> {isLoading ? 'Enviando...' : 'Solicitar Vínculo'}
          </button>
        )}
      </div>
    </div>
  );
};


function VetDashboardPage() {
  const [epid, setEpid] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!epid.trim()) return;
    
    setIsLoading(true);
    setMessage('');
    setSearchResult(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/vet/find-pet/${epid.trim()}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setSearchResult(data);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={sharedStyles.tabTitle} style={{ marginBottom: 0 }}>Panel de Veterinario</h2>
      </div>

      <div className={styles.searchSection}>
        <h3>Buscar Paciente por EnlaPet ID (EPID)</h3>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={epid}
            onChange={(e) => setEpid(e.target.value)}
            placeholder="Introduce el EPID de la mascota"
            className={styles.searchInput}
            maxLength="6"
          />
          <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} disabled={isLoading}>
            <Search size={18}/> {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      <div className={styles.resultsSection}>
        {message && <p className={sharedStyles.responseMessageError}>{message}</p>}
        {searchResult && <PetSearchResult pet={searchResult} />}
      </div>
    </div>
  );
}

export default VetDashboardPage;