// frontend/src/PostDetailModal.jsx
// Versión: 1.1 - Refactorización a CSS Modules
// TAREA: Se implementan los módulos de estilos para corregir el posicionamiento.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import PostCard from './PostCard';
import LoadingComponent from './LoadingComponent';

// 1. IMPORTAMOS los nuevos módulos de CSS
import styles from './PostDetailModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PostDetailModal() {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const onClose = () => navigate(-1);

  const fetchPostData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      const headers = { 'Authorization': `Bearer ${idToken}` };

      const postRes = await fetch(`${API_URL}/api/posts/${postId}`, { headers });
      if (!postRes.ok) throw new Error('No se pudo cargar la publicación.');
      const postData = await postRes.json();
      setPost(postData);

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

  const handleLikeToggle = () => {
    if (!post) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setPost(p => ({...p, likesCount: p.likesCount + (newLikedState ? 1 : -1)}));
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
    // 2. APLICAMOS las clases de los módulos de CSS
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.wrapper} onClick={e => e.stopPropagation()}>
        {isLoading && <LoadingComponent text="Cargando momento..." />}
        {error && <div className={styles.errorMessage}>{error}</div>}
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