import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';

const PostCard = ({ post: initialPost }) => {
  // Usamos un estado local para el post para poder actualizarlo (ej. el contador de likes)
  const [post, setPost] = useState(initialPost);
  const [author, setAuthor] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Lógica para obtener el autor (como la teníamos antes)
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
    
    // Lógica para verificar si al usuario actual ya le gusta este post
    const checkIfLiked = () => {
        // Esta es una simulación. En una app real, el backend debería
        // decirnos si el usuario ya ha dado like a este post.
        // Por ahora, asumimos que no le ha dado like.
        // TODO: Obtener el estado real del like desde el backend.
        setIsLiked(false);
    }

    fetchAuthor();
    checkIfLiked();
  }, [post.id]); // Dependemos del ID del post

  const handleLike = async () => {
    // Implementación de "Optimistic Update" para una mejor UX.
    // 1. Actualizamos la UI inmediatamente.
    setIsLiked(!isLiked);
    setPost(prevPost => ({
        ...prevPost,
        likesCount: isLiked ? prevPost.likesCount - 1 : prevPost.likesCount + 1
    }));

    // 2. Hacemos la llamada a la API en segundo plano.
    try {
        if (isLiked) {
            // Si ya le gustaba, llamamos a la ruta para quitar el like.
            await api.delete(`/posts/${post.id}/like`);
        } else {
            // Si no le gustaba, llamamos a la ruta para dar like.
            await api.post(`/posts/${post.id}/like`);
        }
    } catch (error) {
        // 3. Si la API falla, revertimos el cambio en la UI y mostramos un error.
        console.error("Error al actualizar el like:", error);
        setIsLiked(!isLiked); // Revertimos el estado del botón
        setPost(prevPost => ({ // Revertimos el contador
            ...prevPost,
            likesCount: isLiked ? prevPost.likesCount + 1 : prevPost.likesCount - 1
        }));
        // Aquí podríamos mostrar una notificación de error al usuario.
    }
  };

  if (!post || !author) {
    return <div>Cargando publicación...</div>;
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
