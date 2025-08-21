// frontend/src/LostAndFoundPage.jsx
// (NUEVO) Página dedicada a mostrar todas las mascotas en modo rescate activo.

import React, { useState, useEffect, useCallback } from 'react';
import LostPetCard from './components/LostPetCard';
import LoadingComponent from './LoadingComponent';
import styles from './LostAndFoundPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LostAndFoundPage() {
  const [lostPets, setLostPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLostPets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Este es un endpoint público, no requiere autenticación.
      const response = await fetch(`${API_URL}/api/public/rescue/all`);
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar las mascotas en búsqueda.');
      }

      const data = await response.json();
      setLostPets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLostPets();
  }, [fetchLostPets]);

  const renderContent = () => {
    if (isLoading) {
      return <LoadingComponent text="Buscando mascotas que necesitan ayuda..." />;
    }
    if (error) {
      return <p className={sharedStyles.responseMessageError}>{error}</p>;
    }
    if (lostPets.length === 0) {
      return (
        <div className={sharedStyles.emptyStateMessage}>
          <h3>¡Buenas noticias!</h3>
          <p>Actualmente no hay mascotas reportadas como extraviadas en la comunidad.</p>
        </div>
      );
    }
    return (
      <div className={styles.grid}>
        {lostPets.map(pet => (
          <LostPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2 className={sharedStyles.tabTitle}>Búsquedas Activas</h2>
      <p className={styles.subtitle}>
        Estas son las mascotas de nuestra comunidad que necesitan ayuda para volver a casa. 
        Si las ves, por favor haz clic en "Ver Aviso" para contactar a su responsable.
      </p>
      {renderContent()}
    </div>
  );
}

export default LostAndFoundPage;