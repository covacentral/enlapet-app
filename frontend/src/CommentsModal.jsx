// frontend/src/CommentsModal.jsx
// Versión: 1.1 - Estilo Corregido
// Utiliza las clases CSS correctas para funcionar como un modal flotante.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { X } from 'lucide-react';

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
      <div className="comments-modal-content" onClick={e => e.stopPropagation()}>
        <div className="comments-modal-header">
          <h2>Comentarios</h2>
          <button onClick={onClose} className="close-button" disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>
        <div className="comments-list">
          {isLoading && <p>Cargando...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!isLoading && comments.length === 0 && (
            <p className="text-gray-500 text-center py-4">No hay comentarios. ¡Sé el primero!</p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <img 
                src={comment.authorProfilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} 
                alt={comment.authorName} 
                className="comment-author-pic"
              />
              <div className="comment-text-content">
                <strong>{comment.authorName}</strong>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="comments-modal-footer">
          <form onSubmit={handleSubmitComment} className="comment-form">
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
