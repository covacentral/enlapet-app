// frontend/src/FeedPage.jsx
// Versión: 2.1 - Publicación Inmediata
// Implementa la lógica para mostrar un nuevo post en el feed
// instantáneamente después de su creación.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';
import CreatePostPrompt from './CreatePostPrompt';
import CreatePostModal from './CreatePostModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FeedPage({ userProfile, pets }) {
  const [posts, setPosts] = useState([]);
  const [likedStatuses, setLikedStatuses] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
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

  const fetchFeed = useCallback(async (cursor, reset = false) => {
    if (reset || posts.length === 0) setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      
      const url = cursor ? `${API_URL}/api/feed?cursor=${cursor}` : `${API_URL}/api/feed`;
      
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${idToken}` } });
      if (!response.ok) throw new Error((await response.json()).message);
      const data = await response.json();
      
      setPosts(prevPosts => reset ? data.posts : [...prevPosts, ...data.posts]);
      setNextCursor(data.nextCursor);
      if (!data.nextCursor) setHasMore(false);

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
  }, [posts.length]);

  useEffect(() => {
    fetchFeed(null, true);
  }, []);

  // [REFINADO] La función ahora acepta el nuevo post y lo añade al estado.
  const handlePostCreated = (newPost) => {
    setIsModalOpen(false);
    if (newPost) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    } else {
      // Fallback si el backend no devuelve el post, recargamos todo.
      fetchFeed(null, true);
    }
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

  const handleLoadMore = () => { if (hasMore) fetchFeed(nextCursor); };

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
