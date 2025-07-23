// frontend/src/FeedPage.jsx
// Versión: 1.3 - Gestión de Estado de Guardado
// Implementa la lógica para guardar y quitar publicaciones de forma optimista.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [likedStatuses, setLikedStatuses] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({}); // ¡NUEVO!
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursors, setNextCursors] = useState({ followedCursor: null, discoveryCursor: null });
  const [hasMore, setHasMore] = useState(true);

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

      if (!response.ok) throw new Error((await response.json()).message);

      const data = await response.json();
      setPosts(prevPosts => [...prevPosts, ...data.posts]);
      setNextCursors(data.nextCursors);
      if (!data.nextCursors.followedCursor && !data.nextCursors.discoveryCursor) setHasMore(false);

      if (data.posts.length > 0) {
        const postIds = data.posts.map(p => p.id);
        const [likes, saves] = await Promise.all([
            fetchStatuses('/api/posts/like-statuses', postIds, idToken),
            fetchStatuses('/api/posts/save-statuses', postIds, idToken)
        ]);
        setLikedStatuses(prev => ({ ...prev, ...likes }));
        setSavedStatuses(prev => ({ ...prev, ...saves }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPosts([]); 
    fetchFeed({ followedCursor: null, discoveryCursor: null });
  }, [fetchFeed]);

  const handleLikeToggle = async (postId) => { /* ...código existente sin cambios... */ };
  const handleCommentAdded = (postId) => { /* ...código existente sin cambios... */ };

  const handleSaveToggle = async (postId) => {
    const isCurrentlySaved = !!savedStatuses[postId];
    setSavedStatuses(prev => ({ ...prev, [postId]: !isCurrentlySaved }));

    try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = isCurrentlySaved ? `/api/posts/${postId}/unsave` : `/api/posts/${postId}/save`;
        const method = isCurrentlySaved ? 'DELETE' : 'POST';

        await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
    } catch (error) {
        console.error("Error en el toggle de guardado:", error);
        setSavedStatuses(prev => ({ ...prev, [postId]: isCurrentlySaved })); // Revertir
    }
  };

  const handleLoadMore = () => { if (hasMore) fetchFeed(nextCursors); };

  return (
    <div className="feed-page-container">
      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post}
              isLiked={!!likedStatuses[post.id]}
              isSaved={!!savedStatuses[post.id]} // Pasamos el estado de guardado
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle} // Pasamos el nuevo manejador
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      ) : ( /* ...código existente sin cambios... */ )}
      {/* ...resto del JSX sin cambios... */}
    </div>
  );
}

export default FeedPage;
