import React, { useState, useEffect, useCallback } from 'react';
import useAuth from './hooks/useAuth';
import api from './services/api';
import { X, Send } from 'lucide-react';
import LoadingComponent from './LoadingComponent';

const CommentItem = ({ comment }) => {
  // Pequeño componente para mostrar un comentario individual
  // TODO: Se necesitará una lógica para obtener los datos del autor del comentario.
  return (
    <div className="comment-item">
      <div className="comment-author-avatar">
        <img src={comment.author?.profilePictureUrl || 'https://placehold.co/40x40/EFEFEF/333333?text=U'} alt="avatar" />
      </div>
      <div className="comment-content">
        <strong>{comment.author?.name || 'Usuario'}</strong>
        <p>{comment.text}</p>
        <small>{new Date(comment.createdAt).toLocaleString('es-CO')}</small>
      </div>
    </div>
  );
};

const CommentsModal = ({ postId, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      // TODO: El backend necesita devolver los comentarios con la info del autor.
      // Por ahora, el frontend funcionará con lo que reciba.
      setComments(response.data);
    } catch (err) {
      console.error("Error al cargar los comentarios:", err);
      setError('No se pudieron cargar los comentarios.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      // Enviamos el nuevo comentario al backend
      await api.post(`/posts/${postId}/comment`, { text: newComment });
      setNewComment(''); // Limpiamos el input
      // Volvemos a cargar los comentarios para mostrar el nuevo
      await fetchComments(); 
    } catch (err) {
      console.error("Error al publicar el comentario:", err);
      setError('No se pudo enviar tu comentario.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content comments-modal">
        <div className="modal-header">
          <h3>Comentarios</h3>
          <button onClick={onClose} className="close-modal-button"><X size={24} /></button>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <LoadingComponent />
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
              ) : (
                <p>No hay comentarios todavía. ¡Sé el primero!</p>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer comment-input-section">
          <form onSubmit={handlePostComment} className="comment-form">
            <input
              type="text"
              placeholder="Añade un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isPosting}
            />
            <button type="submit" disabled={isPosting}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
