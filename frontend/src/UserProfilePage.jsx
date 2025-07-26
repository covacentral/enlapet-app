// frontend/src/UserProfilePage.jsx
// Versión: 2.0 - Conexión a API y Datos Dinámicos
// TAREA 3: Se implementa la llamada a la API para obtener y mostrar datos reales del perfil del usuario.

import React, { useState, useEffect, useCallback } from 'react';
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
  
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnProfile = auth.currentUser?.uid === userId;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Debes iniciar sesión para ver perfiles.");
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/public/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo cargar el perfil.');
      }

      const { userProfile: profileData, pets: petsData } = await response.json();
      setUserProfile(profileData);
      setPets(petsData);

      // Aquí iría la lógica para cargar los posts del usuario en el futuro
      // Por ahora, la pestaña de posts estará vacía.

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  if (isLoading) return <LoadingComponent text="Cargando perfil..." />;
  if (error) return <div className="error-message" style={{padding: '2rem'}}>{error}</div>;
  if (!userProfile) return <div className="empty-state-message">No se encontró el perfil del usuario.</div>;

  return (
    <>
      <header className="pet-social-profile-container">
        <div className="profile-cover-photo"></div>
        <div className="social-profile-header">
          <div className="social-profile-details">
            <div className="social-profile-picture-wrapper">
              <img 
                src={userProfile.profilePictureUrl || 'https://placehold.co/300x300/9B89B3/FFFFFF?text=U'} 
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
