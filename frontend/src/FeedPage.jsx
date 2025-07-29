import React, { useState, useEffect, useCallback } from 'react';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';
import CreatePostPrompt from './CreatePostPrompt';
import api from './services/api';
import useAuth from './hooks/useAuth';

const FeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchFeed = useCallback(async () => {
    console.log('[FeedPage] Iniciando fetchFeed...');
    setLoading(true);
    setError(null);
    try {
      console.log('[FeedPage] Solicitando feed a /api/feed...');
      const response = await api.get('/feed');

      // --- LOG DE DEPURACIÓN CRÍTICO ---
      console.log('[FeedPage] Respuesta de /api/feed recibida:', response);

      if (!response || !response.data) {
        throw new Error("La respuesta de la API del feed no tiene el formato esperado.");
      }
      
      // Verificamos si la respuesta es un array
      if (!Array.isArray(response.data)) {
        console.error('[FeedPage] ¡ALERTA! La respuesta de la API no es un array. Es:', typeof response.data);
        throw new Error("Los datos recibidos para el feed no son un array.");
      }

      setPosts(response.data);
      console.log('[FeedPage] Posts actualizados en el estado:', response.data);

    } catch (err) {
      // --- LOG DE ERROR CRÍTICO ---
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('[FeedPage] ERROR FATAL al obtener el feed:', err);
      if (err.response) {
        console.error('[FeedPage] Datos del error de la API:', err.response.data);
      }
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      setError('No se pudo cargar el feed. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
      console.log('[FeedPage] Carga del feed finalizada.');
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  console.log(`[FeedPage] Renderizando. Loading: ${loading}, Error: ${error}, Posts: ${posts.length}`);

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message" style={{ padding: '20px', color: 'red' }}>{error}</div>;
  }
  
  // --- RENDERIZADO ---
  // Este bloque es el sospechoso final. Si los datos no tienen la estructura
  // que PostCard espera, puede romperse aquí.
  try {
    return (
      <div className="feed-page">
        <CreatePostPrompt userProfilePic={user?.profilePictureUrl} />
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="empty-feed-message" style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
            <h3>¡Bienvenido a EnlaPet!</h3>
            <p>Tu feed está listo para llenarse de aventuras.</p>
            <p>Sigue a otras mascotas para no perderte nada.</p>
          </div>
        )}
      </div>
    );
  } catch (renderError) {
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.error('[FeedPage] ERROR FATAL DURANTE EL RENDERIZADO:', renderError);
      console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      return <div style={{color: 'red', padding: '20px'}}>Ocurrió un error al intentar mostrar las publicaciones.</div>
  }
};

export default FeedPage;
