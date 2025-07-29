import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';

const PostCard = ({ post: initialPost }) => {
  // Usamos un estado local para el post para poder actualizarlo (ej. el contador de likes)
  const [post, setPost] = useState(initialPost);
  const [author, setAuthor] = useState(null);
  const [isLiked, setIsLiked] = useState(false); // Estado para saber si al usuario actual le gusta
  const { user } = useAuth();

  useEffect(() => {
    // Lógica para obtener el autor (sea usuario o mascota)
    const fetchAuthor = async () => {
      if (!post || !post.authorId || !post.authorType) return;
      
      const endpoint = post.authorType === 'pet' 
        ? `/public/pets/${post.authorId}` 
        : `/public/users/${post.authorId}`;

      try {
        const response = await api.get(endpoint);
        setAuthor(response.data);
      } catch (error) {
        console.error(`[PostCard ${post.id}] ERROR al obtener el autor:`, error);
      }
    };
    
    // TODO: El backend debería indicarnos si el post ya tiene like del usuario.
    // Por ahora, lo inicializamos en false.
    const checkIfLiked = () => {
        setIsLiked(false);
    }

    fetchAuthor();
    checkIfLiked();
  }, [post.id]); // Se ejecuta si el post cambia

  const handleLike = async () => {
    // "Optimistic Update" para una UX fluida
    setIsLiked(currentState => !currentState);
    setPost(currentPost => ({
        ...currentPost,
        likesCount: isLiked ? currentPost.likesCount - 1 : currentPost.likesCount + 1
    }));

    try {
      if (isLiked) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    } catch (error) {
      console.error("Error al actualizar el like:", error);
      // Revertimos el cambio si la API falla
      setIsLiked(currentState => !currentState);
      setPost(currentPost => ({
        ...currentPost,
        likesCount: isLiked ? currentPost.likesCount + 1 : currentPost.likesCount - 1
      }));
    }
  };

  if (!post || !author) {
    return <div className="loading-placeholder">Cargando publicación...</div>;
  }

  const profileLink = post.authorType === 'pet' ? `/pet/${author.id}/social` : `/profile/${author.id}`;

  return (
    <div className="post-card">
      <div className="post-header">
        <Link to={profileLink} className="author-link">
          <img 
            src={author.profilePictureUrl || 'https://placehold.co/50x50/EFEFEF/333333?text=A'} 
            alt={author.name} 
            className="author-avatar"
          />
          <span className="author-name">{author.name || 'Autor Desconocido'}</span>
        </Link>
        <button className="post-options-button"><MoreHorizontal size={20} /></button>
      </div>
      
      {post.imageUrl && (
        <div className="post-image-container">
          <img src={post.imageUrl} alt="Contenido del post" className="post-image" />
        </div>
      )}

      <div className="post-content"><p>{post.text}</p></div>

      <div className="post-actions">
        <button onClick={handleLike} className={`action-button ${isLiked ? 'liked' : ''}`}>
          <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{post.likesCount || 0}</span>
        </button>
        <button className="action-button">
          <MessageCircle size={22} />
          <span>{post.commentsCount || 0}</span>
        </button>
        <button className="action-button bookmark"><Bookmark size={22} /></button>
      </div>
    </div>
  );
};

export default PostCard;
