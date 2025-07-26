// frontend/src/ProfileLayout.jsx
// Versión: 2.4 - Pestaña de Eventos (Completo)
// Añade la nueva pestaña "Eventos" y su ruta correspondiente.

import { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from './firebase';
import './App.css';

import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx';
import MapPage from './MapPage.jsx';
import EventsPage from './EventsPage.jsx';
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import UserProfilePage from './UserProfilePage.jsx'; // Se importa el nuevo componente
import LoadingComponent from './LoadingComponent.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className="pet-bubble" title={pet.name}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ConfirmLogoutModal = ({ onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Cerrar Sesión</h3>
      <p>¿Estás seguro de que quieres cerrar tu sesión?</p>
      <div className="modal-actions">
        <button onClick={onCancel} className="modal-button cancel">Cancelar</button>
        <button onClick={onConfirm} className="modal-button confirm">Confirmar</button>
      </div>
    </div>
  </div>
);

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const [profileResponse, petsResponse] = await Promise.all([
        fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${API_URL}/api/pets`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
      ]);
      const profileData = await profileResponse.json();
      const petsData = await petsResponse.json();
      if (!profileResponse.ok) throw new Error(profileData.message);
      if (!petsResponse.ok) throw new Error(petsData.message);
      setUserProfile(profileData);
      setPets(petsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    <div className="profile-container">
      {showLogoutConfirm && ( <ConfirmLogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} /> )}
      
      <header className="main-header">
        <div className="user-profile-section">
          <h2>{userProfile?.name}</h2>
          <div className="profile-picture-container">
            {userProfile && userProfile.profilePictureUrl ? (
              <img src={userProfile.profilePictureUrl} alt="Perfil" className="profile-picture" />
            ) : (
              <div className="profile-picture-placeholder">👤</div>
            )}
          </div>
          <p className="profile-bio">{userProfile?.bio || 'Sin biografía.'}</p>
        </div>
        <div className="user-pets-section">
          <h1 className="header-brand-title">enlapet</h1>
          <div className="pet-bubbles-container">
            {pets.length > 0 ? (
              pets.map(pet => <PetBubble key={pet.id} pet={pet} />)
            ) : (
              <p className="no-pets-header">Añade tu primera mascota</p>
            )}
          </div>
        </div>
      </header>

      <nav className="profile-tabs profile-tabs-six">
        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink>
        <NavLink to="/dashboard/map" className={({ isActive }) => isActive ? 'active' : ''}>Mapa</NavLink>
        <NavLink to="/dashboard/events" className={({ isActive }) => isActive ? 'active' : ''}>Eventos</NavLink>
        <NavLink to="/dashboard/saved" className={({ isActive }) => isActive ? 'active' : ''}>Guardados</NavLink>
        <NavLink to="/dashboard/pets" className={({ isActive }) => isActive ? 'active' : ''}>Mascotas</NavLink>
        <div className="profile-tab-wrapper">
          <NavLink to="/dashboard/settings" className={({ isActive }) => `profile-main-button ${isActive ? 'active' : ''}`}>Perfil</NavLink>
          <button onClick={() => setShowLogoutConfirm(true)} className="logout-icon-button" title="Cerrar sesión">
            <LogoutIcon />
          </button>
        </div>
      </nav>

      {/* --- SECCIÓN ACTUALIZADA --- */}
      <main className="tab-content">
        <Routes>
          <Route index element={<FeedPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchAllData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchAllData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile />} />
          
          {/* Se añade la nueva ruta para los perfiles de usuario */}
          <Route path="user/:userId" element={<UserProfilePage />} />

        </Routes>
      </main>
    </div>
  );
}

export default ProfileLayout;
