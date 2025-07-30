// frontend/src/PostDetailModal.jsx
// (NUEVO Y FUNCIONAL) Componente para mostrar un post individual en una vista modal.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PostDetailModal() {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // La función para cerrar el modal simplemente nos lleva a la página anterior.
  const onClose = () => navigate(-1);

  // Hook para cargar todos los datos necesarios para el post.
  const fetchPostData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      const headers = { 'Authorization': `Bearer ${idToken}` };

      // 1. Cargar los datos principales del post usando el nuevo endpoint.
      const postRes = await fetch(`${API_URL}/api/posts/${postId}`, { headers });
      if (!postRes.ok) throw new Error('No se pudo cargar la publicación.');
      const postData = await postRes.json();
      setPost(postData);

      // 2. Cargar los estados de 'like' y 'guardado' para este post.
      const postIds = [postId];
      const [likeStatusRes, saveStatusRes] = await Promise.all([
        fetch(`${API_URL}/api/posts/like-statuses`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ postIds }),
        }),
        fetch(`${API_URL}/api/posts/save-statuses`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ postIds }),
        })
      ]);
      
      if (likeStatusRes.ok) setIsLiked((await likeStatusRes.json())[postId]);
      if (saveStatusRes.ok) setIsSaved((await saveStatusRes.json())[postId]);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  // Funciones para manejar la interactividad del PostCard desde este modal.
  const handleLikeToggle = () => {
    if (!post) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setPost(p => ({...p, likesCount: p.likesCount + (newLikedState ? 1 : -1)}));
    // Llamada a la API en segundo plano
    (async () => {
        const user = auth.currentUser; if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = newLikedState ? `/api/posts/${postId}/like` : `/api/posts/${postId}/unlike`;
        const method = newLikedState ? 'POST' : 'DELETE';
        await fetch(`${API_URL}${endpoint}`, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
    })();
  };

  const handleSaveToggle = () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    (async () => {
        const user = auth.currentUser; if (!user) return;
        const idToken = await user.getIdToken();
        const endpoint = newSavedState ? `/api/posts/${postId}/save` : `/api/posts/${postId}/unsave`;
        const method = newSavedState ? 'POST' : 'DELETE';
        await fetch(`${API_URL}${endpoint}`, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
    })();
  };

  const handleCommentAdded = () => {
    if (!post) return;
    setPost(p => ({...p, commentsCount: p.commentsCount + 1}));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="post-detail-modal-wrapper" onClick={e => e.stopPropagation()}>
        {isLoading && <LoadingComponent text="Cargando momento..." />}
        {error && <div className="error-message" style={{padding: '2rem', color: 'white'}}>{error}</div>}
        {post && (
            <PostCard 
                post={post}
                isLiked={isLiked}
                isSaved={isSaved}
                onLikeToggle={handleLikeToggle}
                onSaveToggle={handleSaveToggle}
                onCommentAdded={handleCommentAdded}
            />
        )}
      </div>
    </div>
  );
}

export default PostDetailModal;