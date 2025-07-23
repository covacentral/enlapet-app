// frontend/src/SavedPostsPage.jsx
// Versión: 1.0 - Página de Publicaciones Guardadas
// Muestra una colección de todas las publicaciones que el usuario ha guardado.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SavedPostsPage() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Para esta página, asumimos que todos los posts mostrados están guardados y likeados (si aplica)
  const [statuses, setStatuses] = useState({ liked: {}, saved: {} });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/user/saved-posts`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar las publicaciones guardadas.');
      }

      const posts = await response.json();
      setSavedPosts(posts);

      // Obtenemos los estados de like para los posts guardados
      if (posts.length > 0) {
        const postIds = posts.map(p => p.id);
        const likeStatusResponse = await fetch(`${API_URL}/api/posts/like-statuses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ postIds }),
        });
        const likedData = await likeStatusResponse.json();
        
        // Todos los posts aquí están guardados, así que creamos un objeto de estado de guardado
        const savedData = postIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});

        setStatuses({ liked: likedData, saved: savedData });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cuando un post es "des-guardado" desde esta página, simplemente lo eliminamos de la lista.
  const handleSaveToggle = (postId) => {
    setSavedPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    // También hacemos la llamada a la API en segundo plano para que sea persistente
    (async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            await fetch(`${API_URL}/api/posts/${postId}/unsave`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
        } catch (error) {
            console.error("Error al quitar de guardados:", error);
            // Si falla, podríamos añadir lógica para volver a mostrar el post, pero por ahora lo mantenemos simple.
        }
    })();
  };
  
  // La lógica de like es similar a la del FeedPage
  const handleLikeToggle = async (postId) => {
    const isCurrentlyLiked = !!statuses.liked[postId];
    setStatuses(prev => ({ ...prev, liked: { ...prev.liked, [postId]: !isCurrentlyLiked } }));
    setSavedPosts(prevPosts => prevPosts.map(p => 
        p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) } : p
    ));
    // Llamada a la API en segundo plano...
  };


  if (isLoading) return <LoadingComponent text="Cargando tus momentos guardados..." />;
  if (error) return <p className="text-center text-red-500 font-bold my-4">{error}</p>;

  return (
    <div className="saved-posts-container">
      <h2 className="tab-title">Mis Momentos Guardados</h2>
      {savedPosts.length > 0 ? (
        <div className="posts-list">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={!!statuses.liked[post.id]}
              isSaved={!!statuses.saved[post.id]}
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle}
              // onCommentAdded se puede omitir o manejar si se desea
            />
          ))}
        </div>
      ) : (
        <p className="empty-state-message">Aún no has guardado ninguna publicación. ¡Explora el feed y guarda tus momentos favoritos!</p>
      )}
    </div>
  );
}

export default SavedPostsPage;
