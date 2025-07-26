// frontend/src/UserProfilePage.jsx
// Versión: 1.0 - Estructura Estática del Perfil de Usuario
// TAREA 2: Se crea el componente con la estructura visual completa, usando datos de ejemplo.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Componente reutilizable para la tarjeta de mascota en el perfil de usuario
const UserPetCard = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className="user-pet-card">
    <div className="user-pet-card-image-wrapper">
      <img src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
    </div>
    <div className="user-pet-card-info">
      <strong>{pet.name}</strong>
      <span>{pet.breed}</span>
    </div>
  </Link>
);

function UserProfilePage() {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('pets'); // 'posts' o 'pets'
  
  // --- DATOS DE EJEMPLO (TEMPORAL) ---
  const [userProfile, setUserProfile] = useState({
    name: 'Nombre de Usuario',
    bio: 'Esta es una biografía de ejemplo. El usuario puede escribir algo sobre sí mismo o su negocio aquí.',
    profilePictureUrl: 'https://placehold.co/300x300/9B89B3/FFFFFF?text=U',
    followersCount: 125,
    followingCount: 88,
  });
  const [pets, setPets] = useState([
    {id: '1', name: 'Firulais', breed: 'Mestizo', petPictureUrl: 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'},
    {id: '2', name: 'Luna', breed: 'Labrador', petPictureUrl: 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'},
  ]);
  const [posts, setPosts] = useState([]); // Aún no tenemos posts de usuario
  const [isLoading, setIsLoading] = useState(false); // Cambiar a true cuando conectemos la API
  const [error, setError] = useState('');
  
  // Lógica de seguimiento (a implementar en Tarea 4)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnProfile = auth.currentUser?.uid === userId;

  if (isLoading) return <LoadingComponent text="Cargando perfil..." />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <>
      <header className="pet-social-profile-container">
        <div className="profile-cover-photo"></div>
        <div className="social-profile-header">
          <div className="social-profile-details">
            <div className="social-profile-picture-wrapper">
              <img 
                src={userProfile.profilePictureUrl} 
                alt={userProfile.name} 
                className="social-profile-picture"
              />
            </div>
            <div className="social-profile-info">
              <h1>{userProfile.name}</h1>
              <p>{userProfile.bio}</p>
              <div className="user-profile-stats" style={{marginTop: '10px'}}>
                <div className="stat-item">
                  <strong>{userProfile.followersCount}</strong>
                  <span>Seguidores</span>
                </div>
                <div className="stat-item">
                  <strong>{userProfile.followingCount}</strong>
                  <span>Siguiendo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="social-profile-actions">
            {!isOwnProfile && (
              <button 
                className={`profile-action-button ${isFollowing ? 'following' : 'follow'}`} 
                disabled={followLoading}
              >
                {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="modal-tabs" style={{margin: '0', borderRadius: '0', borderTop: '1px solid var(--border-color)'}}>
        <button type="button" className={`modal-tab-button ${activeTab === 'pets' ? 'active' : ''}`} onClick={() => setActiveTab('pets')}>
          Mascotas
        </button>
        <button type="button" className={`modal-tab-button ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          Publicaciones
        </button>
      </div>

      <main className="profile-content">
        {activeTab === 'pets' && (
          <div className="user-pets-grid">
            {pets.length > 0 ? (
              pets.map(pet => <UserPetCard key={pet.id} pet={pet} />)
            ) : (
              <p className="empty-state-message">Este usuario aún no ha registrado ninguna mascota.</p>
            )}
          </div>
        )}
        {activeTab === 'posts' && (
          <div className="user-posts-list">
             <p className="empty-state-message">Este usuario aún no ha hecho ninguna publicación.</p>
          </div>
        )}
      </main>
    </>
  );
}

export default UserProfilePage;
