// frontend/src/UserProfilePage.jsx
// Versión: 5.0 - Refactorizado para usar UserContext y PetContext.
// TAREA: Se elimina la lógica de fetch local y se consumen los datos desde los contextos globales.

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext'; // <-- 1. Importamos useUser
import { usePets } from './context/PetContext'; // <-- 2. Importamos usePets

import LoadingComponent from './LoadingComponent';
import PostCard from './PostCard';
import AppointmentModal from './AppointmentModal';

import styles from './UserProfilePage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Componentes Internos (sin cambios en su lógica interna) ---
const UserPetCard = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className={styles.petCard}>
    <div className={styles.petCardImageWrapper}>
      <img src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
    </div>
    <div className={styles.petCardInfo}>
      <strong>{pet.name}</strong>
      <span>{pet.breed}</span>
    </div>
  </Link>
);


function UserProfilePage() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  
  // 3. Consumimos los datos del perfil y las mascotas directamente de los contextos.
  const { userProfile: viewingUserProfile, isLoading: isLoadingProfile, error: profileError } = useUser();
  const { pets: viewingUserPets } = usePets();

  const [activeTab, setActiveTab] = useState('pets');
  
  // Estados para datos específicos de ESTE perfil (que puede no ser el del usuario logueado)
  const [profileData, setProfileData] = useState(null);
  const [petsOfProfile, setPetsOfProfile] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState('');
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  
  const [likedStatuses, setLikedStatuses] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({});

  const isOwnProfile = currentUser?.uid === userId;
  
  // --- Lógica de Fetch Simplificada ---
  useEffect(() => {
    const fetchDataForProfile = async () => {
      setIsLoadingPage(true);
      setError('');
      try {
        if (!currentUser) throw new Error("Debes iniciar sesión para ver perfiles.");
        const idToken = await currentUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${idToken}` };
        
        // Obtenemos los datos públicos del perfil que se está visitando
        const profileRes = await fetch(`${API_URL}/api/public/users/${userId}`, { headers });
        if (!profileRes.ok) throw new Error('No se pudo cargar el perfil.');
        const { userProfile, pets } = await profileRes.json();
        setProfileData(userProfile);
        setPetsOfProfile(pets);

        // Obtenemos las publicaciones de este perfil
        const postsRes = await fetch(`${API_URL}/api/posts/by-author/${userId}`, { headers });
        if (!postsRes.ok) throw new Error('No se pudieron cargar las publicaciones.');
        const postsData = await postsRes.json();
        
        const enrichedPosts = postsData.map(post => ({ ...post, author: userProfile }));
        setPosts(enrichedPosts);

        // Si no es nuestro propio perfil, verificamos si lo seguimos
        if (!isOwnProfile) {
          const followStatusRes = await fetch(`${API_URL}/api/profiles/${userId}/follow-status`, { headers });
          if (followStatusRes.ok) setIsFollowing((await followStatusRes.json()).isFollowing);
        }
        
        // Obtenemos estados de like/save para las publicaciones
        if (postsData.length > 0) {
          const postIds = postsData.map(p => p.id);
          const [likes, saves] = await Promise.all([
              fetch(`${API_URL}/api/posts/like-statuses`, { method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify({ postIds }) }).then(res => res.json()),
              fetch(`${API_URL}/api/posts/save-statuses`, { method: 'POST', headers: {'Content-Type': 'application/json', ...headers}, body: JSON.stringify({ postIds }) }).then(res => res.json())
          ]);
          setLikedStatuses(likes || {});
          setSavedStatuses(saves || {});
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchDataForProfile();
  }, [userId, currentUser, isOwnProfile]);


  // --- Handlers de Interacción (La lógica interna no cambia) ---
  const handleFollowToggle = async () => {
    setFollowLoading(true);
    const endpoint = isFollowing ? `${API_URL}/api/profiles/${userId}/unfollow` : `${API_URL}/api/profiles/${userId}/follow`;
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
        const idToken = await currentUser.getIdToken();
        await fetch(endpoint, { 
            method, 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ profileType: 'user' }) 
        });
        setIsFollowing(!isFollowing);
        setProfileData(prev => ({ ...prev, followersCount: prev.followersCount + (isFollowing ? -1 : 1) }));
    } finally {
        setFollowLoading(false);
    }
  };
  const handleLikeToggle = (postId) => setLikedStatuses(prev => ({ ...prev, [postId]: !prev[postId] }));
  const handleSaveToggle = (postId) => setSavedStatuses(prev => ({ ...prev, [postId]: !prev[postId] }));
  const handleCommentAdded = (postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));


  // --- Renderizado ---
  if (isLoadingProfile || isLoadingPage) return <LoadingComponent text="Cargando perfil..." />;
  if (error || profileError) return <div className={sharedStyles.responseMessageError}>{error || profileError}</div>;
  if (!profileData) return <div className={sharedStyles.emptyStateMessage}>No se encontró el perfil del usuario.</div>;

  const isVetProfile = profileData?.verification?.status === 'verified' && profileData?.verification?.type === 'vet';

  return (
    <>
      {isAppointmentModalOpen && (
        <AppointmentModal 
          vetProfile={profileData}
          pets={viewingUserPets} // <-- 4. Pasamos las mascotas del contexto
          onClose={() => setIsAppointmentModalOpen(false)}
        />
      )}

      <div className={styles.pageContainer}>
        <header className={styles.profileHeader}>
          <div className={styles.coverPhoto}></div>
          <div className={styles.headerContent}>
            <div className={styles.details}>
              <div className={styles.pictureWrapper}>
                <img 
                  src={profileData.profilePictureUrl || 'https://placehold.co/300x300/9B89B3/FFFFFF?text=U'} 
                  alt={profileData.name} 
                  className={styles.picture}
                />
              </div>
              <div className={styles.info}>
                <h1>{profileData.name}</h1>
                <p>{profileData.bio}</p>
              </div>
            </div>
            <div className={styles.actions}>
              {isOwnProfile ? (
                <Link to="/dashboard/settings" className={`${sharedStyles.button} ${sharedStyles.primary}`}>Editar Perfil</Link>
              ) : (
                <>
                  <button className={`${sharedStyles.button} ${isFollowing ? sharedStyles.secondary : sharedStyles.primary}`} disabled={followLoading} onClick={handleFollowToggle}>
                    {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                  </button>
                  {isVetProfile && (
                    <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={() => setIsAppointmentModalOpen(true)}>Agendar Cita</button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
        
        <div className={sharedStyles.modalTabs} style={{borderRadius: 0}}>
          <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'pets' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('pets')}>Mascotas</button>
          <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'posts' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('posts')}>Publicaciones</button>
        </div>

        <main className={styles.profileContent}>
           {activeTab === 'pets' && ( <div className={styles.petsGrid}> {petsOfProfile.length > 0 ? ( petsOfProfile.map(pet => <UserPetCard key={pet.id} pet={pet} />) ) : ( <p className={sharedStyles.emptyStateMessage}>Este usuario aún no ha registrado ninguna mascota.</p> )} </div> )}
           {activeTab === 'posts' && ( <div className="user-posts-list"> {posts.length > 0 ? ( posts.map(post => ( <PostCard key={post.id} post={post} isLiked={!!likedStatuses[post.id]} isSaved={!!savedStatuses[post.id]} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onCommentAdded={handleCommentAdded} /> )) ) : ( <p className={sharedStyles.emptyStateMessage}>Este usuario aún no ha hecho ninguna publicación.</p> )} </div> )}
        </main>
      </div>
    </>
  );
}

export default UserProfilePage;