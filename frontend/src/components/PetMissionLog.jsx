// frontend/src/components/PetMissionLog.jsx
// Muestra una galería con las insignias de las misiones completadas por una mascota.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import styles from './PetMissionLog.module.css';
import sharedStyles from '../shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PetMissionLog({ petId }) {
  const [completedMissions, setCompletedMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompletedMissions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      
      // Este es el nuevo endpoint que necesitaremos en el backend
      const response = await fetch(`${API_URL}/api/pets/${petId}/completed-missions`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el historial de misiones.');
      }
      
      const data = await response.json();
      setCompletedMissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    fetchCompletedMissions();
  }, [fetchCompletedMissions]);

  if (isLoading) {
    return <p>Cargando hitos...</p>;
  }

  if (error) {
    return <p className={sharedStyles.responseMessageError}>{error}</p>;
  }

  return (
    <div className={styles.container}>
      {completedMissions.length > 0 ? (
        <div className={styles.grid}>
          {completedMissions.map(mission => (
            <div key={mission.id} className={styles.badge} title={`${mission.title}\n${mission.description}`}>
              <img src={mission.reward.badgeImageUrl} alt={mission.reward.badgeName} />
              <span className={styles.badgeName}>{mission.reward.badgeName}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={sharedStyles.emptyStateMessage} style={{padding: '2rem 0'}}>
          Esta mascota aún no ha completado ninguna misión. ¡Anímate a empezar una nueva aventura!
        </p>
      )}
    </div>
  );
}

export default PetMissionLog;