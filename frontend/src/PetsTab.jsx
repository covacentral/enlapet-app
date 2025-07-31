// frontend/src/PetsTab.jsx
// Versión: 2.1 - Refactorización a CSS Modules
// TAREA: Se implementan los módulos de estilos local y compartido, y se elimina la etiqueta <style> en línea.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PetEditModal from './PetEditModal';

// 1. IMPORTAMOS los módulos de CSS necesarios
import styles from './PetsTab.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UpdatePrompt = () => (
    <div className={styles.updatePrompt}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>¡Completa mi perfil!</span>
    </div>
);

function PetCard({ pet, onEdit }) {
  const isProfileIncomplete = !pet.location?.city || !pet.healthRecord?.birthDate;

  return (
    <div className={styles.petCard}>
      <div className={styles.imageContainer}>
        {pet.petPictureUrl ? (
          <img src={pet.petPictureUrl} alt={pet.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>🐾</div>
        )}
      </div>
      <div className={styles.info}>
        <button className={styles.nameButton} onClick={() => onEdit(pet)}>
            <div className={styles.nameBreedWrapper}>
                <h3>{pet.name}</h3>
                {pet.breed && <p className={styles.breedSubtitle}>{pet.breed}</p>}
            </div>
            {isProfileIncomplete && <UpdatePrompt />}
        </button>
        <div className={styles.actions}>
           <Link to={`/pet/${pet.id}`} className={`${sharedStyles.button} ${sharedStyles.buttonPrimary}`} style={{width: '100%', textDecoration: 'none'}}>Ver Perfil Público</Link>
        </div>
      </div>
    </div>
  );
}

function PetsTab({ user, initialPets, onPetsUpdate }) {
  const [pets, setPets] = useState(initialPets);
  const [message, setMessage] = useState('');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    setPets(initialPets);
  }, [initialPets]);

  const handleAddPet = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage('Registrando mascota...');
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name: petName, breed: petBreed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage('¡Mascota añadida con éxito!');
      setPetName('');
      setPetBreed('');
      onPetsUpdate();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsAdding(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleOpenModal = (pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPet(null);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* 2. APLICAMOS las clases de los módulos de CSS */}
      <div className={styles.container}>
        <div className={styles.addPetColumn}>
          <h2>Registrar Nueva Mascota</h2>
          <form onSubmit={handleAddPet}>
            <div className={sharedStyles.formGroup}>
                <label htmlFor="petName">Nombre:</label>
                <input type="text" id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} required disabled={isAdding} />
            </div>
            <div className={sharedStyles.formGroup}>
                <label htmlFor="petBreed">Raza (Opcional):</label>
                <input type="text" id="petBreed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} disabled={isAdding} />
            </div>
            <button type="submit" className={`${sharedStyles.button} ${sharedStyles.buttonPrimary}`} style={{width: '100%'}} disabled={isAdding}>
                {isAdding ? 'Añadiendo...' : 'Añadir Mascota'}
            </button>
          </form>
          {message && <p className={sharedStyles.responseMessage}>{message}</p>}
        </div>
        <div className={styles.petsListColumn}>
          <h2>Mis Mascotas</h2>
          <div className={styles.list}>
            {pets.length > 0 ? (
              pets.map(pet => (
                <PetCard key={pet.id} pet={pet} onEdit={handleOpenModal} />
              ))
            ) : (
              <p>Aún no has registrado ninguna mascota.</p>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (<PetEditModal pet={selectedPet} user={user} onClose={handleCloseModal} onUpdate={onPetsUpdate} />)}
    </>
  );
}

export default PetsTab;