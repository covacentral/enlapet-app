// frontend/src/CommentsModal.jsx
// Versión: 2.1 - Refactorización a CSS Modules
// TAREA: Se implementa el módulo de estilos local para desacoplarlo del CSS global.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { X } from 'lucide-react';

// 1. IMPORTAMOS nuestro nuevo módulo de estilos
import styles from './CommentsModal.module.css';
// Se importan los estilos compartidos para elementos comunes como el backdrop.
import sharedStyles from './shared.module.css'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function CommentsModal({ postId, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar los comentarios.');
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ text: newComment })
      });
      if (!response.ok) throw new Error('No se pudo publicar el comentario.');
      const addedComment = await response.json();
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
      onCommentAdded(postId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // 2. APLICAMOS las nuevas clases de estilo. Usamos el módulo compartido para el backdrop.
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Comentarios</h2>
          <button onClick={onClose} className={styles.closeButton} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>
        <div className={styles.list}>
          {isLoading && <p>Cargando...</p>}
          {error && <p className={sharedStyles.responseMessageError}>{error}</p>}
          {!isLoading && comments.length === 0 && (
            <p className={styles.emptyMessage}>No hay comentarios. ¡Sé el primero!</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className={styles.item}>
              <img 
                src={comment.authorProfilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} 
                alt={comment.authorName} 
                className={styles.authorPic}
              />
              <div className={styles.textContent}>
                <Link to={`/dashboard/user/${comment.authorId}`} className={styles.authorLink}>
                  {comment.authorName}
                </Link>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <form onSubmit={handleSubmitComment} className={styles.form}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Añade un comentario..."
              disabled={isSubmitting}
            />
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '...' : 'Publicar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CommentsModal;