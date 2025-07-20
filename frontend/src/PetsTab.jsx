import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

function PetCard({ pet, user, onUpdate }) {
  // ... (El código del componente PetCard se mantiene exactamente igual)
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
      const response = await fetch(`${API_URL}/api/pets/${pet.id}`, {
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
      setMessage(`Error: ${error.message}`);
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
      const response = await fetch(`${API_URL}/api/pets/${pet.id}/picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('¡Foto actualizada!');
      onUpdate();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
      setTimeout(() => setMessage(''), 3000);
    }
  };

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
        {isEditMode ? (
          <form onSubmit={handleSaveChanges} className="pet-edit-form">
            <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} required disabled={isLoading} />
            <input type="text" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} placeholder="Raza (Opcional)" disabled={isLoading} />
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
  
  // --- 1. AMPLIAMOS EL ESTADO DEL FORMULARIO ---
  const [formState, setFormState] = useState({
    name: '',
    breed: '',
    city: '',
    country: '',
    birthDate: '',
    gender: 'Macho'
  });

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setPets(initialPets);
  }, [initialPets]);

  // --- 2. ACTUALIZAMOS EL MANEJADOR DE CAMBIOS ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleAddPet = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setMessage('Registrando mascota...');
    try {
      const idToken = await user.getIdToken(true);
      
      // --- 3. CONSTRUIMOS EL CUERPO DE LA PETICIÓN CON LOS NUEVOS DATOS ---
      const petPayload = {
        name: formState.name,
        breed: formState.breed,
        location: {
          city: formState.city,
          country: formState.country
        },
        birthDate: formState.birthDate,
        gender: formState.gender
      };

      const response = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(petPayload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage('¡Mascota añadida con éxito!');
      // Reseteamos el formulario
      setFormState({ name: '', breed: '', city: '', country: '', birthDate: '', gender: 'Macho' });
      onPetsUpdate(); // Llama a la función para recargar las mascotas
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsAdding(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="pets-tab-container">
      <div className="dashboard-column add-pet-column">
        <h2>Registrar Nueva Mascota</h2>
        {/* --- 4. ACTUALIZAMOS EL FORMULARIO CON LOS NUEVOS CAMPOS --- */}
        <form onSubmit={handleAddPet} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Nombre de la Mascota:</label>
            <input type="text" id="name" name="name" value={formState.name} onChange={handleFormChange} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="breed">Raza (Opcional):</label>
            <input type="text" id="breed" name="breed" value={formState.breed} onChange={handleFormChange} disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="city">Ciudad de Residencia:</label>
            <input type="text" id="city" name="city" value={formState.city} onChange={handleFormChange} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="country">País de Residencia:</label>
            <input type="text" id="country" name="country" value={formState.country} onChange={handleFormChange} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="birthDate">Fecha de Nacimiento (Aprox.):</label>
            <input type="date" id="birthDate" name="birthDate" value={formState.birthDate} onChange={handleFormChange} disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Género:</label>
            <select id="gender" name="gender" value={formState.gender} onChange={handleFormChange} disabled={isAdding}>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </div>
          <button type="submit" disabled={isAdding}>
            {isAdding ? 'Añadiendo...' : 'Añadir Mascota'}
          </button>
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
