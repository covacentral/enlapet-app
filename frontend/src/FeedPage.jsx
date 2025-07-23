// frontend/src/FeedPage.jsx
// Versión: 1.2 - Gestión de Estado de Comentarios
// Actualiza el contador de comentarios en la UI cuando se añade uno nuevo.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [likedStatuses, setLikedStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursors, setNextCursors] = useState({ followedCursor: null, discoveryCursor: null });
  const [hasMore, setHasMore] = useState(true);

  const fetchLikeStatuses = async (postIds, idToken) => {
    try {
        const response = await fetch(`${API_URL}/api/posts/like-statuses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ postIds }),
        });
        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error("Error fetching like statuses:", error);
        return {};
    }
  };

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
      
      setPosts(prevPosts => [...prevPosts, ...data.posts]);
      setNextCursors(data.nextCursors);

      if (!data.nextCursors.followedCursor && !data.nextCursors.discoveryCursor) {
        setHasMore(false);
      }

      if (data.posts.length > 0) {
        const postIds = data.posts.map(p => p.id);
        const statuses = await fetchLikeStatuses(postIds, idToken);
        setLikedStatuses(prevStatuses => ({ ...prevStatuses, ...statuses }));
      }

    } catch (err) {
      console.error("Error en fetchFeed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Limpiamos los posts al montar para evitar duplicados en desarrollo con HMR
    setPosts([]); 
    fetchFeed({ followedCursor: null, discoveryCursor: null });
  }, [fetchFeed]);

  const handleLikeToggle = async (postId) => {
    const isCurrentlyLiked = !!likedStatuses[postId];
    setLikedStatuses(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
            return { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) };
        }
        return p;
    }));

    try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = isCurrentlyLiked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`;
        const method = isCurrentlyLiked ? 'DELETE' : 'POST';

        await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
    } catch (error) {
        console.error("Error en el toggle de like:", error);
        setLikedStatuses(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => {
            if (p.id === postId) {
                return { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? 1 : -1) };
            }
            return p;
        }));
    }
  };

  // ¡NUEVO! Manejador para actualizar el contador de comentarios
  const handleCommentAdded = (postId) => {
    setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
            return { ...p, commentsCount: p.commentsCount + 1 };
        }
        return p;
    }));
  };

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
            <PostCard 
              key={post.id} 
              post={post}
              isLiked={!!likedStatuses[post.id]}
              onLikeToggle={handleLikeToggle}
              onCommentAdded={handleCommentAdded} // Pasamos la nueva función
            />
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
