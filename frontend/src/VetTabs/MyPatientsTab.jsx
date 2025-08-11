// frontend/src/VetTabs/MyPatientsTab.jsx
// Versión 1.2: Corrige el error "API_URL is not defined".

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../firebase';
import styles from './MyPatientsTab.module.css';
import sharedStyles from '../shared.module.css';
import LoadingComponent from '../LoadingComponent';
import PatientDetailModal from '../PatientDetailModal';

// --- LÍNEA AÑADIDA ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function MyPatientsTab() {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);

  const fetchPatients = useCallback(async () => {
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/vet/my-patients`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error((await response.json()).message || 'No se pudieron cargar los pacientes.');
      }
      
      const data = await response.json();
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenModal = (pet) => {
    setSelectedPet(pet);
  };

  const handleCloseModal = () => {
    setSelectedPet(null);
  };
  
  if (isLoading) {
    return <p>Cargando pacientes...</p>;
  }

  if (error) {
    return <p className={sharedStyles.responseMessageError}>{error}</p>;
  }

  return (
    <>
      {selectedPet && (
        <PatientDetailModal
          petSummary={selectedPet}
          onClose={handleCloseModal}
          onUpdate={fetchPatients}
        />
      )}

      <div>
        {patients.length > 0 ? (
          <div className={styles.patientList}>
            {patients.map(pet => (
              <button onClick={() => handleOpenModal(pet)} key={pet.id} className={styles.patientCard}>
                <img 
                  src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'}
                  alt={pet.name}
                  className={styles.petImage}
                />
                <div className={styles.petInfo}>
                  <h4>{pet.name}</h4>
                  <p>{pet.breed || 'Raza no especificada'}</p>
                  <p>Responsable: {pet.ownerInfo.name}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p>Aún no tienes pacientes vinculados. Utiliza la pestaña "Vincular Paciente" para añadir nuevos.</p>
        )}
      </div>
    </>
  );
}

export default MyPatientsTab;