// frontend/src/CommentsModal.jsx
// Versión: 2.1 - Refactorización a CSS Modules
// CAMBIO: Se importa y utiliza un módulo de CSS local.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import { X } from 'lucide-react';
import styles from './CommentsModal.module.css'; // <-- 1. Importamos el módulo

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
    <div className="modal-backdrop" onClick={onClose}>
      {/* --- 2. Se actualizan las clases para usar el objeto 'styles' --- */}
      <div className={styles.commentsModalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Comentarios</h2>
          <button onClick={onClose} className={styles.closeButton} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>
        <div className={styles.commentsList}>
          {isLoading && <p>Cargando...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!isLoading && comments.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay comentarios. ¡Sé el primero!</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <img 
                src={comment.authorProfilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} 
                alt={comment.authorName} 
                className={styles.commentAuthorPic}
              />
              <div className={styles.commentTextContent}>
                <Link to={`/dashboard/user/${comment.authorId}`} className="inline-profile-link">
                  {comment.authorName}
                </Link>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.modalFooter}>
          <form onSubmit={handleSubmitComment} className={styles.commentForm}>
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