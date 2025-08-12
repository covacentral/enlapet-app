// frontend/src/VetTabs/LinkPatientTab.jsx
// Versión 1.2: Refactorización visual para eliminar contenedor.
// TAREA: Se elimina la tarjeta y el título para que el componente sea modular.

import { useState } from 'react';
import { auth } from '../firebase';
import { Search, Send, CheckCircle } from 'lucide-react';
import styles from './LinkPatientTab.module.css';
import sharedStyles from '../shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
    <>
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
      {message && !requestSent && <p className={sharedStyles.responseMessageError} style={{marginTop: '1rem'}}>{message}</p>}
    </>
  );
};

function LinkPatientTab() {
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
      
      const response = await fetch(`${API_URL}/api/vet/find-pet/${epid.trim().toUpperCase()}`, {
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
  
  // --- ESTRUCTURA MODIFICADA ---
  // Se elimina el div contenedor principal y el h3.
  return (
    <div>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={epid}
          onChange={(e) => setEpid(e.target.value)}
          placeholder="Introduce el EPID de la mascota"
          className={styles.searchInput}
          maxLength="6"
        />
        <button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary} ${styles.searchButton}`} disabled={isLoading}>
          <Search size={18}/> 
          <span className={styles.buttonText}>{isLoading ? '...' : 'Buscar'}</span>
        </button>
      </form>
      
      <div className={styles.resultsSection}>
        {message && <p className={sharedStyles.responseMessageError}>{message}</p>}
        {searchResult && <PetSearchResult pet={searchResult} />}
      </div>
    </div>
  );
}

export default LinkPatientTab;