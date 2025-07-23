// frontend/src/ProfileLayout.jsx
// Versión: 2.2 - Pestaña de Publicaciones Guardadas
// Añade la nueva pestaña "Guardados" y su ruta correspondiente.

import { useState, useEffect } from 'react';
import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { signOut } from "firebase/auth";
import { auth } from './firebase';
import './App.css';

// Componentes de las vistas
import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx'; // ¡NUEVO!
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import LoadingComponent from './LoadingComponent.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PetBubble = ({ pet }) => ( /* ...código existente sin cambios... */ );
const LogoutIcon = () => ( /* ...código existente sin cambios... */ );
const ConfirmLogoutModal = ({ onConfirm, onCancel }) => ( /* ...código existente sin cambios... */ );

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fetchAllData = async () => { /* ...código existente sin cambios... */ };

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
        {/* ...código del header sin cambios... */}
      </header>

      <nav className="profile-tabs">
        <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink>
        <NavLink to="/dashboard/saved" className={({ isActive }) => isActive ? 'active' : ''}>Guardados</NavLink> {/* ¡NUEVO! */}
        <NavLink to="/dashboard/pets" className={({ isActive }) => isActive ? 'active' : ''}>Mascotas</NavLink>
        <div className="profile-tab-wrapper">
          <NavLink to="/dashboard/settings" className={({ isActive }) => `profile-main-button ${isActive ? 'active' : ''}`}>Perfil</NavLink>
          <button onClick={() => setShowLogoutConfirm(true)} className="logout-icon-button" title="Cerrar sesión">
            <LogoutIcon />
          </button>
        </div>
      </nav>

      <main className="tab-content">
        <Routes>
          <Route index element={<FeedPage />} />
          <Route path="saved" element={<SavedPostsPage />} /> {/* ¡NUEVO! */}
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchAllData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchAllData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default ProfileLayout;
