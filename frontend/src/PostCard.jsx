import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';

const PostCard = ({ post }) => {
  console.log('[PostCard] Renderizando con los siguientes datos de post:', post);

  const [author, setAuthor] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAuthor = async () => {
      if (!post || !post.authorId || !post.authorType) {
        console.error(`[PostCard ${post.id}] Error: El post no tiene authorId o authorType.`);
        return;
      }
      
      // --- LÓGICA INTELIGENTE ---
      // Determinamos la ruta correcta basada en el tipo de autor.
      const isPet = post.authorType === 'pet';
      const endpoint = isPet 
        ? `/public/pets/${post.authorId}` 
        : `/public/users/${post.authorId}`;

      console.log(`[PostCard ${post.id}] Iniciando fetchAuthor para ${post.authorType} con ID ${post.authorId} en la ruta: ${endpoint}`);

      try {
        const response = await api.get(endpoint);
        console.log(`[PostCard ${post.id}] Respuesta de ${endpoint}:`, response);
        setAuthor(response.data);
      } catch (error) {
        console.error(`[PostCard ${post.id}] ERROR FATAL al obtener el autor:`, error);
      }
    };

    fetchAuthor();
  }, [post]);

  try {
    if (!post || !author) {
      return <div>Cargando publicación...</div>;
    }

    // Determinamos la ruta del perfil dinámicamente.
    const profileLink = post.authorType === 'pet'
      ? `/pet/${author.id}/social`
      : `/profile/${author.id}`;

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
          <button className="post-options-button">
            <MoreHorizontal size={20} />
          </button>
        </div>
        
        {post.imageUrl && (
          <div className="post-image-container">
            <img src={post.imageUrl} alt="Contenido del post" className="post-image" />
          </div>
        )}

        <div className="post-content">
          <p>{post.text}</p>
        </div>

        <div className="post-actions">
          <button className="action-button">
            <Heart size={22} />
            <span>{post.likesCount || 0}</span>
          </button>
          <button className="action-button">
            <MessageCircle size={22} />
            <span>{post.commentsCount || 0}</span>
          </button>
          <button className="action-button bookmark">
            <Bookmark size={22} />
          </button>
        </div>
      </div>
    );
  } catch (renderError) {
    console.error(`[PostCard ${post?.id}] ERROR FATAL DURANTE EL RENDERIZADO:`, renderError);
    return <div style={{color: 'red', border: '1px solid red', padding: '10px', margin: '10px'}}>Ocurrió un error al mostrar este post.</div>;
  }
};

export default PostCard;
