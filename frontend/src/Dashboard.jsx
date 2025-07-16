import { useState, useEffect } from 'react';
import { auth } from './firebase'; 
import { signOut } from "firebase/auth";
import './App.css';

function Dashboard({ user }) {
  const [pets, setPets] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  
  const [phone, setPhone] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [petMessage, setPetMessage] = useState('');


  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchPets = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://localhost:3001/api/pets', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al obtener las mascotas.');
      setPets(data);
    } catch (error) {
      console.error("Error fetching pets:", error);
      setPetMessage(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchPets();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile && userProfile.phone) {
      setPhone(userProfile.phone);
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('Actualizando...');
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('http://localhost:3001/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ phone: phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setProfileMessage(data.message);
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileMessage(error.message);
    }
  };

  // --- FUNCIÓN CORREGIDA ---
  const handleAddPet = async (e) => {
    e.preventDefault();
    setPetMessage('Registrando mascota...');
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://localhost:3001/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name: petName, breed: petBreed }),
      });
      
      // La variable 'data' se define aquí, ANTES de ser usada.
      const data = await response.json(); 
      
      if (!response.ok) throw new Error(data.message || 'Error al registrar la mascota.');
      
      setPetMessage(data.message);
      setPetName('');
      setPetBreed('');
      fetchPets(); 
    } catch (error) {
      console.error('Error:', error);
      setPetMessage(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="App-header">
      <h1>Panel de Control de EnlaPet</h1>
      <p>Bienvenido, {userProfile ? userProfile.name : user.email}</p>
      <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>

      <div className="dashboard-container">
        <div className="dashboard-column">
          <h2>Mi Perfil</h2>
          <form onSubmit={handleUpdateProfile} className="register-form">
            <div className="form-group">
              <label htmlFor="phone">Teléfono de Contacto:</label>
              <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="573001234567" required />
            </div>
            <button type="submit">Guardar Teléfono</button>
          </form>
          {profileMessage && <p className="response-message">{profileMessage}</p>}
          
          <hr />

          <h2>Mis Mascotas</h2>
          <div className="pets-list">
            {pets.length > 0 ? (
              pets.map(pet => (
                <div key={pet.id} className="pet-card">
                  <h3>{pet.name}</h3>
                  <p>Raza: {pet.breed}</p>
                  <a href={`/pet/${pet.id}`} target="_blank" rel="noopener noreferrer" className="link-button">
                    Ver Perfil Público
                  </a>
                </div>
              ))
            ) : (
              <p>Aún no has registrado ninguna mascota.</p>
            )}
          </div>
        </div>

        <div className="dashboard-column">
          <h2>Registrar una Nueva Mascota</h2>
          <form onSubmit={handleAddPet} className="register-form">
            <div className="form-group">
              <label htmlFor="petName">Nombre:</label>
              <input type="text" id="petName" value={petName} onChange={(e) => setPetName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="petBreed">Raza:</label>
              <input type="text" id="petBreed" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} required />
            </div>
            <button type="submit">Añadir Mascota</button>
          </form>
          {petMessage && <p className="response-message">{petMessage}</p>}
        </div>
      </div>
    </header>
  );
}

export default Dashboard;
