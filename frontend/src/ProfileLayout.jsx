// frontend/src/ProfileLayout.jsx
// Versión: 3.0 - Carta de Presentación Social
// MEJORA: Se añade un display para los contadores de seguidores y seguidos.
// MEJORA: Se reestructura el CSS para una mejor presentación visual.

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
import LoadingComponent from './LoadingComponent.jsx';
import { Users, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PetBubble = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className="pet-bubble" title={`${pet.name}\nSeguidores: ${pet.followersCount}`}>
    {pet.petPictureUrl ? <img src={pet.petPictureUrl} alt={pet.name} /> : <span>🐾</span>}
  </Link>
);

const ConfirmLogoutModal = ({ onConfirm, onCancel }) => (
  <div className="modal-backdrop">
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
    // No mostramos el loader en recargas para una UX más fluida
    if (!userProfile) setLoading(true); 
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
    <>
      {/* Estilos específicos para las nuevas mejoras */}
      <style>{`
        .user-profile-stats { display: flex; gap: 1.5rem; margin-top: 1rem; }
        .stat-item { text-align: center; }
        .stat-item strong { font-size: 1.2rem; display: block; }
        .stat-item span { font-size: 0.8rem; color: var(--text-secondary); }
        .user-profile-section { align-items: flex-start; text-align: left; }
      `}</style>

      <div className="profile-container">
        {showLogoutConfirm && ( <ConfirmLogoutModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} /> )}
        
        <header className="main-header">
          <div className="user-profile-section">
            <div className="profile-picture-container">
              {userProfile && userProfile.profilePictureUrl ? (
                <img src={userProfile.profilePictureUrl} alt="Perfil" className="profile-picture" />
              ) : (
                <div className="profile-picture-placeholder">👤</div>
              )}
            </div>
            <div>
              <h2>{userProfile?.name}</h2>
              <p className="profile-bio">{userProfile?.bio || 'Edita tu perfil para añadir una biografía.'}</p>
              <div className="user-profile-stats">
                <div className="stat-item">
                  <strong>{userProfile?.followersCount || 0}</strong>
                  <span>Seguidores</span>
                </div>
                <div className="stat-item">
                  <strong>{userProfile?.followingCount || 0}</strong>
                  <span>Siguiendo</span>
                </div>
              </div>
            </div>
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
            <NavLink to="/dashboard" end>Inicio</NavLink>
            <NavLink to="/dashboard/map">Mapa</NavLink>
            <NavLink to="/dashboard/events">Eventos</NavLink>
            <NavLink to="/dashboard/saved">Guardados</NavLink>
            <NavLink to="/dashboard/pets">Mascotas</NavLink>
            <div className="profile-tab-wrapper">
              <NavLink to="/dashboard/settings" className="profile-main-button">Perfil</NavLink>
              <button onClick={() => setShowLogoutConfirm(true)} className="logout-icon-button" title="Cerrar sesión">
                <LogOut size={20} />
              </button>
            </div>
        </nav>

        <main className="tab-content">
          <Routes>
            <Route index element={<FeedPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="saved" element={<SavedPostsPage />} />
            <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchAllData} />} />
            <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchAllData} />} />
            <Route path="pet/:petId" element={<PetSocialProfile />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default ProfileLayout;
