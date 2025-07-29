import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';
import LoadingComponent from './LoadingComponent';
import PostCard from './PostCard'; // Reutilizamos el PostCard funcional

const PetSocialProfile = () => {
  const { petId } = useParams(); // Obtiene el ID de la mascota desde la URL
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Verificamos si la mascota pertenece al usuario logueado
  const isMyPet = profileData?.ownerId === currentUser.uid;

  const checkFollowingStatus = useCallback(async () => {
    if (isMyPet) return;
    try {
      // TODO: Optimizar esto en el futuro. Por ahora, funciona.
      const followingList = currentUser.following || [];
      setIsFollowing(followingList.includes(petId));
    } catch (error) {
      console.error("Error al verificar el estado de seguimiento de la mascota:", error);
      setIsFollowing(false);
    }
  }, [currentUser, petId, isMyPet]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [profileResponse, postsResponse] = await Promise.all([
          api.get(`/public/pets/${petId}`),
          api.get(`/posts/user/${petId}`) // La ruta funciona con el ID de la mascota como autor
        ]);
        
        setProfileData(profileResponse.data);
        setPosts(postsResponse.data);
        
        checkFollowingStatus();

      } catch (error) {
        console.error("Error al obtener los datos del perfil de la mascota:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [petId, checkFollowingStatus]);

  const handleFollow = async () => {
    if (isMyPet) return;
    
    setIsFollowing(currentState => !currentState);

    try {
      const endpoint = `/profiles/${petId}/follow`;
      if (isFollowing) {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint);
      }
    } catch (error) {
      console.error("Error al actualizar el estado de seguimiento:", error);
      setIsFollowing(currentState => !currentState);
    }
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (!profileData) {
    return <div>No se pudo cargar el perfil de la mascota.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-section">
        <img 
          src={profileData.coverPhotoUrl || 'https://placehold.co/600x200/A9A9A9/FFFFFF?text=Pet+Cover'} 
          alt="Foto de portada de la mascota" 
          className="profile-cover-photo"
        />
        <div className="profile-details">
          <img 
            src={profileData.profilePictureUrl || 'https://placehold.co/150x150/EFEFEF/333333?text=Pet'} 
            alt="Perfil de la mascota" 
            className="profile-main-pic"
          />
          <div className="profile-info">
            <h2>{profileData.name}</h2>
            <p className="profile-bio">{profileData.breed || 'Una mascota increíble.'}</p>
          </div>
          <div className="profile-actions">
            {isMyPet ? (
              <button className="profile-button">Editar Perfil de Mascota</button>
            ) : (
              <button onClick={handleFollow} className={`profile-button ${isFollowing ? 'following' : ''}`}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="profile-content">
        <h3>Publicaciones de {profileData.name}</h3>
        <div className="posts-grid">
            {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <p>Esta mascota aún no tiene publicaciones.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default PetSocialProfile;
