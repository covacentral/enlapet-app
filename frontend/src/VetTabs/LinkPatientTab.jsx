// frontend/src/VetTabs/LinkPatientTab.jsx
// Versión 1.3: Corrección de layout del buscador y tarjeta de resultado.
// TAREA: Se ajusta el JSX para que el botón de solicitar vínculo ocupe una nueva fila.

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
        {/* --- ESTRUCTURA MODIFICADA --- */}
        {/* El contenido principal de la tarjeta ahora está en su propio div */}
        <div className={styles.petResultContent}>
            <img
              src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'}
              alt={pet.name}
              className={styles.petImage}
            />
            <div className={styles.petInfo}>
              <h4>{pet.name}</h4>
              <p>{pet.breed || 'Raza no especificada'}</p>
            </div>
        </div>
        {/* El botón de acción ahora está fuera del contenedor flex principal para ocupar su propia fila */}
        <div className={styles.petResultActions}>
          {requestSent ? (
            <div className={styles.requestSentIndicator}>
              <CheckCircle size={20}/> Solicitud Enviada
            </div>
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