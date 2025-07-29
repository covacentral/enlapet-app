import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';
import CreatePostPrompt from './CreatePostPrompt';
import api from './services/api'; // Usamos el servicio de API centralizado
import useAuth from './hooks/useAuth'; // Usamos el hook de autenticación

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth(); // Obtenemos el usuario directamente desde el contexto

  // useCallback memoriza la función para que no se recree en cada render,
  // optimizando el rendimiento y evitando bucles infinitos en useEffect.
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // La lógica es ahora mucho más simple: solo llamamos al endpoint del feed.
      // El token de autenticación y la URL base se añaden automáticamente
      // por nuestro servicio `api.js`.
      const response = await api.get('/feed');
      setPosts(response.data);
    } catch (err) {
      console.error("Error al obtener el feed:", err);
      setError('No se pudo cargar el feed. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }, []); // No tiene dependencias, por lo que solo se crea una vez.

  useEffect(() => {
    // Este efecto se ejecuta solo una vez cuando el componente se monta por primera vez.
    // Gracias al AuthContext, el estado del feed se conservará aunque navegues
    // a otras pestañas y vuelvas, evitando recargas innecesarias.
    fetchFeed();
  }, [fetchFeed]); // La dependencia es la función memorizada `fetchFeed`.

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="feed-page">
      {/* Pasamos la foto de perfil del usuario (obtenida del contexto) al componente para crear posts */}
      <CreatePostPrompt userProfilePic={user?.profilePictureUrl} />
      
      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <div className="empty-feed-message" style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
          <h3>¡Bienvenido a EnlaPet!</h3>
          <p>Parece que tu feed está un poco vacío.</p>
          <p>¡Empieza a seguir a otras mascotas para ver sus aventuras aquí o explora perfiles populares!</p>
        </div>
      )}
    </div>
  );
};

export default FeedPage;
