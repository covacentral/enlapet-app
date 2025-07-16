import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function PetCard({ pet, user, onUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [petName, setPetName] = useState(pet.name);
  const [petBreed, setPetBreed] = useState(pet.breed);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Guardando...');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`http://localhost:3001/api/pets/${pet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name: petName, breed: petBreed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage('¡Guardado!');
      onUpdate();
      setIsEditMode(false);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setPetName(pet.name);
    setPetBreed(pet.breed);
    setIsEditMode(false);
    setMessage('');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading(true);
    setMessage('Subiendo foto...');
    const formData = new FormData();
    formData.append('petPicture', file);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`http://localhost:3001/api/pets/${pet.id}/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('¡Foto actualizada!');
      onUpdate();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="pet-card">
      {/* CAMBIO 1: El contenedor de la imagen ahora solo muestra la imagen */}
      <div className="pet-card-image-container">
        {pet.petPictureUrl ? (
          <img src={pet.petPictureUrl} alt={pet.name} className="pet-card-image" />
        ) : (
          <div className="pet-card-image-placeholder">🐾</div>
        )}
      </div>

      <div className="pet-card-info">
        {isEditMode ? (
          <form onSubmit={handleSaveChanges} className="pet-edit-form">
            <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} required />
            <input type="text" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Raza (Opcional)" />
            
            {/* CAMBIO 2: El botón para cambiar foto se ha movido aquí */}
            <button type="button" className="change-photo-button-edit" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
              {isLoading ? 'Subiendo...' : 'Cambiar Foto'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />

            <div className="pet-edit-actions">
              <button type="submit" disabled={isLoading}>Guardar</button>
              <button type="button" onClick={handleCancel} disabled={isLoading}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="pet-view-info">
            <button className="pet-name-button" onClick={() => setIsEditMode(true)}>
              <div className="pet-name-breed-wrapper">
                <h3>{pet.name}</h3>
                {pet.breed && <p className="pet-breed-subtitle">{pet.breed}</p>}
              </div>
              <EditIcon />
            </button>
            <Link to={`/pet/${pet.id}`} className="link-button view-public-button">Ver Perfil Público</Link>
          </div>
        )}
        {message && <p className="upload-message">{message}</p>}
      </div>
    </div>
  );
}

function PetsTab({ user, initialPets, onPetsUpdate }) {
  const [pets, setPets] = useState(initialPets);
  const [message, setMessage] = useState('');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');

  useEffect(() => {
    setPets(initialPets);
  }, [initialPets]);

  const handleAddPet = async (e) => {
    e.preventDefault();
    setMessage('Registrando mascota...');
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://localhost:3001/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name: petName, breed: petBreed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message);
      setPetName('');
      setPetBreed('');
      onPetsUpdate();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="pets-tab-container">
      <div className="dashboard-column add-pet-column">
        <h2>Registrar Nueva Mascota</h2>
        <form onSubmit={handleAddPet} className="register-form">
          <div className="form-group">
            <label htmlFor="petName">Nombre:</label>
            <input type="text" id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="petBreed">Raza (Opcional):</label>
            <input type="text" id="petBreed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} />
          </div>
          <button type="submit">Añadir Mascota</button>
        </form>
        {message && <p className="response-message">{message}</p>}
      </div>
      <div className="dashboard-column pets-list-column">
        <h2>Mis Mascotas</h2>
        <div className="pets-list">
          {pets.length > 0 ? (
            pets.map(pet => (
              <PetCard key={pet.id} pet={pet} user={user} onUpdate={onPetsUpdate} />
            ))
          ) : (
            <p>Aún no has registrado ninguna mascota.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PetsTab;
