// frontend/src/UserProfilePage.jsx
// Versión: 4.3 - Refactorización COMPLETA a CSS Modules
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import PostCard from './PostCard';
import profileStyles from './SocialProfile.module.css';
import contentStyles from './UserProfilePage.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UserPetCard = ({ pet }) => (
  <Link to={`/dashboard/pet/${pet.id}`} className={contentStyles.userPetCard}>
    <div className={contentStyles.userPetCardImageWrapper}>
      <img src={pet.petPictureUrl || 'https://placehold.co/150x150/E2E8F0/4A5568?text=🐾'} alt={pet.name} />
    </div>
    <div className={contentStyles.userPetCardInfo}>
      <strong>{pet.name}</strong>
      <span>{pet.breed}</span>
    </div>
  </Link>
);

function UserProfilePage() {
  // ... (toda la lógica del componente se mantiene igual) ...
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('pets');
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [likedStatuses, setLikedStatuses] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const isOwnProfile = auth.currentUser?.uid === userId;

  const fetchStatuses = async (endpoint, postIds, idToken) => {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ postIds }),
        });
        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error(`Error fetching statuses from ${endpoint}:`, error);
        return {};
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Debes iniciar sesión para ver perfiles.");
      const idToken = await user.getIdToken();
      const [profileRes, followStatusRes, postsRes] = await Promise.all([
        fetch(`${API_URL}/api/public/users/${userId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        isOwnProfile ? Promise.resolve(null) : fetch(`${API_URL}/api/profiles/${userId}/follow-status`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${API_URL}/api/posts/by-author/${userId}`, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);
      if (!profileRes.ok) throw new Error((await profileRes.json()).message || 'No se pudo cargar el perfil.');
      if (followStatusRes && !followStatusRes.ok) throw new Error('Error al verificar seguimiento.');
      if (!postsRes.ok) throw new Error('No se pudieron cargar las publicaciones.');
      const { userProfile: profileData, pets: petsData } = await profileRes.json();
      const followStatusData = followStatusRes ? await followStatusRes.json() : { isFollowing: false };
      const postsData = await postsRes.json();
      setUserProfile(profileData);
      setPets(petsData);
      setIsFollowing(followStatusData.isFollowing);
      const enrichedPosts = postsData.map(post => ({...post, author: { id: profileData.id, name: profileData.name, profilePictureUrl: profileData.profilePictureUrl } }));
      setPosts(enrichedPosts);
      if (postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const [likes, saves] = await Promise.all([
            fetchStatuses('/api/posts/like-statuses', postIds, idToken),
            fetchStatuses('/api/posts/save-statuses', postIds, idToken)
        ]);
        setLikedStatuses(likes || {});
        setSavedStatuses(saves || {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOwnProfile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    const user = auth.currentUser;
    if (!user || isOwnProfile) return;
    const endpoint = isFollowing ? `${API_URL}/api/profiles/${userId}/unfollow` : `${API_URL}/api/profiles/${userId}/follow`;
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(endpoint, { 
            method, 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ profileType: 'user' }) 
        });
        if (!response.ok) throw new Error('La acción no se pudo completar.');
        setIsFollowing(!isFollowing);
        setUserProfile(prev => ({ ...prev, followersCount: prev.followersCount + (isFollowing ? -1 : 1) }));
    } catch (err) {
        console.error("Error toggling follow:", err);
    } finally {
        setFollowLoading(false);
    }
  };
  const handleLikeToggle = (postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (likedStatuses[postId] ? -1 : 1) } : p));
  const handleSaveToggle = (postId) => setSavedStatuses(prev => ({ ...prev, [postId]: !savedStatuses[postId] }));
  const handleCommentAdded = (postId) => setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));

  if (isLoading) return <LoadingComponent text="Cargando perfil..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!userProfile) return <div className="empty-state-message">No se encontró el perfil del usuario.</div>;

  return (
    <>
      <header className={profileStyles.container}>
        <div className={profileStyles.coverPhoto}></div>
        <div className={profileStyles.header}>
          <div className={profileStyles.details}>
            <div className={profileStyles.pictureWrapper}>
              <img src={userProfile.profilePictureUrl || 'https://placehold.co/300x300/9B89B3/FFFFFF?text=U'} alt={userProfile.name} className={profileStyles.picture}/>
            </div>
            <div className={profileStyles.info}>
              <h1>{userProfile.name}</h1>
              <p>{userProfile.bio}</p>
            </div>
          </div>
          <div className={profileStyles.actions}>
            {isOwnProfile ? (
              <Link to="/dashboard/settings" className="profile-action-button follow">Editar Perfil</Link>
            ) : (
              <button className={`profile-action-button ${isFollowing ? 'following' : 'follow'}`} disabled={followLoading} onClick={handleFollowToggle}>
                {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="modal-tabs" style={{margin: '0', borderRadius: '0', borderTop: '1px solid var(--border-color)'}}>
        <button type="button" className={`modal-tab-button ${activeTab === 'pets' ? 'active' : ''}`} onClick={() => setActiveTab('pets')}>Mascotas</button>
        <button type="button" className={`modal-tab-button ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Publicaciones</button>
      </div>
      <main className={contentStyles.profileContent}>
        {activeTab === 'pets' && (
          <div className={contentStyles.userPetsGrid}>
            {pets.length > 0 ? (
              pets.map(pet => <UserPetCard key={pet.id} pet={pet} />)
            ) : (<p className="empty-state-message">Este usuario aún no ha registrado ninguna mascota.</p>)}
          </div>
        )}
        {activeTab === 'posts' && (
          <div className="user-posts-list">
             {posts.length > 0 ? (
                posts.map(post => (<PostCard key={post.id} post={post} isLiked={!!likedStatuses[post.id]} isSaved={!!savedStatuses[post.id]} onLikeToggle={handleLikeToggle} onSaveToggle={handleSaveToggle} onCommentAdded={handleCommentAdded}/>))
             ) : (<p className="empty-state-message">Este usuario aún no ha hecho ninguna publicación.</p>)}
          </div>
        )}
      </main>
    </>
  );
}

export default UserProfilePage;