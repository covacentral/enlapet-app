// frontend/src/FeedPage.jsx
// Versión: 2.0 - Integración de Creación de Posts
// TAREA 3: Se integra el prompt y el modal para permitir la creación de posts desde el feed.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';
import CreatePostPrompt from './CreatePostPrompt'; // Importamos el prompt
import CreatePostModal from './CreatePostModal';   // Importamos el modal

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FeedPage({ userProfile, pets }) { // Aceptamos props
  const [posts, setPosts] = useState([]);
  const [likedStatuses, setLikedStatuses] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursors, setNextCursors] = useState({ followedCursor: null, discoveryCursor: null });
  const [hasMore, setHasMore] = useState(true);

  // Nuevo estado para controlar la visibilidad del modal
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const fetchFeed = useCallback(async (cursors, reset = false) => {
    // Solo mostramos el loader grande en la carga inicial
    if (reset || posts.length === 0) {
      setIsLoading(true);
    }
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
      
      setPosts(prevPosts => reset ? data.posts : [...prevPosts, ...data.posts]);
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
  }, [posts.length]); // Dependemos de posts.length para decidir si mostrar el loader

  useEffect(() => {
    // Carga inicial del feed
    fetchFeed({ followedCursor: null, discoveryCursor: null }, true);
  }, []); // El array vacío asegura que esto solo se ejecute una vez al montar

  const handlePostCreated = () => {
    setIsModalOpen(false);
    // Refrescamos el feed desde el principio para ver la nueva publicación
    fetchFeed({ followedCursor: null, discoveryCursor: null }, true);
  };

  const handleLikeToggle = async (postId) => {
    const isCurrentlyLiked = !!likedStatuses[postId];
    setLikedStatuses(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) } : p));
    try {
        const user = auth.currentUser; if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = isCurrentlyLiked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`;
        const method = isCurrentlyLiked ? 'DELETE' : 'POST';
        await fetch(`${API_URL}${endpoint}`, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
    } catch (error) {
        setLikedStatuses(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? 1 : -1) } : p));
    }
  };

  const handleCommentAdded = (postId) => setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
  const handleSaveToggle = async (postId) => {
    const isCurrentlySaved = !!savedStatuses[postId];
    setSavedStatuses(prev => ({ ...prev, [postId]: !isCurrentlySaved }));
    try {
        const user = auth.currentUser; if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = isCurrentlySaved ? `/api/posts/${postId}/unsave` : `/api/posts/${postId}/save`;
        const method = isCurrentlySaved ? 'DELETE' : 'POST';
        await fetch(`${API_URL}${endpoint}`, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
    } catch (error) {
        setSavedStatuses(prev => ({ ...prev, [postId]: isCurrentlySaved }));
    }
  };

  const handleLoadMore = () => { if (hasMore) fetchFeed(nextCursors); };

  return (
    <div className="feed-page-container">
      {isModalOpen && (
        <CreatePostModal 
          userProfile={userProfile}
          pets={pets}
          onClose={() => setIsModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      <CreatePostPrompt userProfile={userProfile} onClick={() => setIsModalOpen(true)} />

      {isLoading && posts.length === 0 ? (
        <LoadingComponent text="Buscando nuevos momentos..." />
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post}
              isLiked={!!likedStatuses[post.id]}
              isSaved={!!savedStatuses[post.id]}
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle}
              onCommentAdded={handleCommentAdded}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state-message">
          <h2 style={{fontSize: '1.5rem', fontWeight: 800}}>¡Bienvenido a EnlaPet!</h2>
          <p>Tu feed de inicio está un poco vacío.</p>
          <p>Empieza a seguir a otras mascotas para no perderte sus momentos.</p>
        </div>
      )}
      
      {error && <p className="response-message error">{error}</p>}

      {!isLoading && hasMore && posts.length > 0 && (
        <div style={{textAlign: 'center', marginTop: '2rem'}}>
          <button onClick={handleLoadMore} className="load-more-button">Ver más momentos</button>
        </div>
      )}
    </div>
  );
}

export default FeedPage;
