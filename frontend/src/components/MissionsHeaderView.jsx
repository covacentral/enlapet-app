// frontend/src/components/MissionsHeaderView.jsx
// Componente que renderiza la vista completa de misiones dentro del MainHeader.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import MissionCard from './MissionCard';
import styles from './MissionsHeaderView.module.css';
import sharedStyles from '../shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Componente interno para seleccionar la mascota activa para las misiones
const PetSelector = ({ pets, selectedPetId, onSelect }) => (
  <div className={styles.petSelector}>
    {pets.map(pet => (
      <button 
        key={pet.id}
        className={`${styles.petBubble} ${selectedPetId === pet.id ? styles.selected : ''}`}
        onClick={() => onSelect(pet.id)}
        title={pet.name}
      >
        <img src={pet.petPictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
      </button>
    ))}
  </div>
);

function MissionsHeaderView({ pets, onAcceptMission }) {
  const [selectedPetId, setSelectedPetId] = useState(pets?.[0]?.id || null);
  const [missions, setMissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMissions = useCallback(async () => {
    if (!selectedPetId) {
        setIsLoading(false);
        setMissions([]);
        return;
    };
    
    setIsLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/missions?petId=${selectedPetId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'No se pudieron cargar las misiones.');
      }
      
      const data = await response.json();
      setMissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPetId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);
  
  const handleAccept = (mission) => {
    onAcceptMission(mission, selectedPetId);
  };

  const selectedPetName = pets.find(p => p.id === selectedPetId)?.name || 'tu mascota';

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Misiones para {selectedPetName}</h3>
      
      {pets.length > 1 && (
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelect={setSelectedPetId} />
      )}
      
      <div className={styles.missionsList}>
        {isLoading ? (
          <p>Buscando nuevas aventuras...</p>
        ) : error ? (
          <p className={sharedStyles.responseMessageError}>{error}</p>
        ) : missions.length > 0 ? (
          missions.map(mission => (
            <MissionCard key={mission.id} mission={mission} onAccept={handleAccept} />
          ))
        ) : (
          <p>¡Felicidades! Han completado todas las misiones disponibles.</p>
        )}
      </div>
    </div>
  );
}

export default MissionsHeaderView;