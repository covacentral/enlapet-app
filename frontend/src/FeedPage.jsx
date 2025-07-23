// frontend/src/FeedPage.jsx
// Versión: 1.0 - Página del Feed Principal
// Obtiene y muestra el feed híbrido de publicaciones con paginación.
// Creado para el Sprint 3: Comunidad.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursors, setNextCursors] = useState({ followedCursor: null, discoveryCursor: null });
  const [hasMore, setHasMore] = useState(true);

  // Usamos useCallback para memorizar la función y evitar re-creaciones innecesarias.
  const fetchFeed = useCallback(async (cursors) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      
      const idToken = await user.getIdToken();
      
      const queryParams = new URLSearchParams();
      if (cursors.followedCursor) queryParams.append('followedCursor', cursors.followedCursor);
      if (cursors.discoveryCursor) queryParams.append('discoveryCursor', cursors.discoveryCursor);
      
      const response = await fetch(`${API_URL}/api/feed?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar el feed.');
      }

      const data = await response.json();
      
      // Añadimos nuevos posts a la lista existente para el scroll infinito.
      setPosts(prevPosts => [...prevPosts, ...data.posts]);
      setNextCursors(data.nextCursors);

      // Si la respuesta no trae nuevos cursores, significa que no hay más posts.
      if (!data.nextCursors.followedCursor && !data.nextCursors.discoveryCursor) {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Error en fetchFeed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carga inicial del feed cuando el componente se monta.
  useEffect(() => {
    fetchFeed({ followedCursor: null, discoveryCursor: null });
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if (hasMore) {
      fetchFeed(nextCursors);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center text-gray-500 py-16">
            <h2 className="text-2xl font-bold mb-2">¡Bienvenido a EnlaPet!</h2>
            <p>Tu feed de inicio está un poco vacío.</p>
            <p>Empieza a seguir a otras mascotas para no perderte sus momentos.</p>
          </div>
        )
      )}

      {isLoading && <LoadingComponent text="Buscando nuevos momentos..." />}
      
      {error && <p className="text-center text-red-500 font-bold my-4">{error}</p>}

      {!isLoading && hasMore && posts.length > 0 && (
        <div className="text-center mt-8">
          <button 
            onClick={handleLoadMore}
            className="load-more-button"
          >
            Ver más momentos
          </button>
        </div>
      )}

      {!isLoading && !hasMore && (
        <p className="text-center text-gray-400 mt-10">Has llegado al final. ¡Sigue a más mascotas para descubrir contenido nuevo!</p>
      )}
    </div>
  );
}

export default FeedPage;
