import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';
import LoadingComponent from './LoadingComponent';
import PostCard from './PostCard'; // Reutilizamos el PostCard que ya funciona

const UserProfilePage = () => {
  const { userId } = useParams(); // Obtiene el ID del perfil a ver desde la URL
  const { user: currentUser } = useAuth(); // Obtiene los datos del usuario logueado

  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isMyProfile = currentUser.uid === userId;

  // Función para verificar si el usuario actual ya sigue a este perfil
  const checkFollowingStatus = useCallback(async () => {
    if (isMyProfile) return;
    try {
      // Asumimos que la lista de 'following' del usuario actual está en su objeto de contexto.
      // Esta es una optimización para no tener que llamar a la API cada vez.
      // TODO: Para mayor precisión, el objeto 'user' del AuthContext debería incluir la lista de 'following'.
      const followingList = currentUser.following || [];
      setIsFollowing(followingList.includes(userId));
    } catch (error) {
      console.error("Error al verificar el estado de seguimiento:", error);
      setIsFollowing(false);
    }
  }, [currentUser, userId, isMyProfile]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Obtenemos los datos del perfil y los posts en paralelo para más eficiencia
        const [profileResponse, postsResponse] = await Promise.all([
          api.get(`/public/users/${userId}`),
          api.get(`/posts/user/${userId}`) // Necesitaremos crear este endpoint en el backend
        ]);
        
        setProfileData(profileResponse.data);
        setPosts(postsResponse.data);
        
        checkFollowingStatus();

      } catch (error) {
        console.error("Error al obtener los datos del perfil y los posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, checkFollowingStatus]);

  const handleFollow = async () => {
    if (isMyProfile) return;
    
    // Optimistic Update
    setIsFollowing(currentState => !currentState);

    try {
      const endpoint = `/profiles/${userId}/follow`;
      if (isFollowing) {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint);
      }
      // TODO: Actualizar el estado global del usuario (en AuthContext) para reflejar el nuevo seguimiento.
    } catch (error) {
      console.error("Error al actualizar el estado de seguimiento:", error);
      // Revertir en caso de error
      setIsFollowing(currentState => !currentState);
    }
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (!profileData) {
    return <div>No se pudo cargar el perfil.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-section">
        <img 
          src={profileData.coverPhotoUrl || 'https://placehold.co/600x200/CCCCCC/FFFFFF?text=Cover'} 
          alt="Foto de portada" 
          className="profile-cover-photo"
        />
        <div className="profile-details">
          <img 
            src={profileData.profilePictureUrl || 'https://placehold.co/150x150/EFEFEF/333333?text=User'} 
            alt="Perfil" 
            className="profile-main-pic"
          />
          <div className="profile-info">
            <h2>{profileData.name}</h2>
            <p className="profile-bio">{profileData.bio || '¡Hola! Estoy en EnlaPet.'}</p>
          </div>
          <div className="profile-actions">
            {isMyProfile ? (
              <button className="profile-button">Editar Perfil</button>
            ) : (
              <button onClick={handleFollow} className={`profile-button ${isFollowing ? 'following' : ''}`}>
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="profile-content">
        <h3>Publicaciones</h3>
        <div className="posts-grid">
            {posts.length > 0 ? (
                posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
                <p>Este usuario aún no ha hecho ninguna publicación.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
