// frontend/src/PetsTab.jsx
// Versión: 2.0 - Hoja de Vida
// Implementa la apertura del modal de edición y el aviso de perfil incompleto.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PetEditModal from './PetEditModal';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UpdatePrompt = () => (
    <div className="update-prompt">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>¡Completa mi perfil!</span>
    </div>
);

function PetCard({ pet, onEdit }) {
  const isProfileIncomplete = !pet.location?.city || !pet.healthRecord?.birthDate;

  return (
    <div className="pet-card">
      <div className="pet-card-image-container">
        {pet.petPictureUrl ? (
          <img src={pet.petPictureUrl} alt={pet.name} className="pet-card-image" />
        ) : (
          <div className="pet-card-image-placeholder">🐾</div>
        )}
      </div>
      <div className="pet-card-info">
        <button className="pet-name-button" onClick={() => onEdit(pet)}>
            <div className="pet-name-breed-wrapper">
                <h3>{pet.name}</h3>
                {pet.breed && <p className="pet-breed-subtitle">{pet.breed}</p>}
            </div>
            {isProfileIncomplete && <UpdatePrompt />}
        </button>
        <div className="pet-card-actions">
           <Link to={`/pet/${pet.id}`} className="link-button view-public-button">Ver Perfil Público</Link>
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
      <style>{`
        .update-prompt { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #ffc107; margin-top: 4px; padding: 4px 8px; background-color: rgba(255, 193, 7, 0.1); border-radius: 6px; }
        .pet-name-button { background: none; border: none; padding: 0; margin: 0; cursor: pointer; text-align: left; width: 100%; color: white; }
      `}</style>
      <div className="pets-tab-container">
        <div className="dashboard-column add-pet-column">
          <h2>Registrar Nueva Mascota</h2>
          <form onSubmit={handleAddPet} className="register-form">
            <div className="form-group"><label htmlFor="petName">Nombre:</label><input type="text" id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} required disabled={isAdding} /></div>
            <div className="form-group"><label htmlFor="petBreed">Raza (Opcional):</label><input type="text" id="petBreed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} disabled={isAdding} /></div>
            <button type="submit" disabled={isAdding}>{isAdding ? 'Añadiendo...' : 'Añadir Mascota'}</button>
          </form>
          {message && <p className="response-message">{message}</p>}
        </div>
        <div className="dashboard-column pets-list-column">
          <h2>Mis Mascotas</h2>
          <div className="pets-list">
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
