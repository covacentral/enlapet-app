// frontend/src/LostAndFoundPage.jsx
// Versión 2.0: Implementa paginación ("cargar más") y elimina el contenedor principal.

import React, { useState, useEffect, useCallback } from 'react';
import LostPetCard from './components/LostPetCard';
import LoadingComponent from './LoadingComponent';
import styles from './LostAndFoundPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function LostAndFoundPage() {
  const [lostPets, setLostPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLostPets = useCallback(async (cursor = null) => {
    if (cursor) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = cursor 
        ? `${API_URL}/api/public/rescue/all?cursor=${cursor}`
        : `${API_URL}/api/public/rescue/all`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('No se pudieron cargar las mascotas en búsqueda.');
      }

      const data = await response.json();
      
      setLostPets(prevPets => cursor ? [...prevPets, ...data.pets] : data.pets);
      setNextCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchLostPets(null); // Carga inicial
  }, [fetchLostPets]);

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchLostPets(nextCursor);
    }
  };

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
      <>
        <div className={styles.grid}>
          {lostPets.map(pet => (
            <LostPetCard key={pet.id} pet={pet} />
          ))}
        </div>
        {hasMore && (
            <div className={styles.loadMoreContainer}>
                <button 
                    onClick={handleLoadMore} 
                    className={`${sharedStyles.button} ${sharedStyles.primary}`}
                    disabled={isLoadingMore}
                >
                    {isLoadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
            </div>
        )}
      </>
    );
  };

  return (
    // El div contenedor ahora no tiene la clase "container" que lo hacía una tarjeta.
    <div className={styles.pageContainer}>
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