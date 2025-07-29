import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import api from './services/api';

// Asumo que tienes estos iconos o componentes, ajústalos si es necesario
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';

const PostCard = ({ post }) => {
  // --- LOG DE DEPURACIÓN CRÍTICO ---
  // Esto nos mostrará la estructura exacta del post que estamos recibiendo.
  console.log('[PostCard] Renderizando con los siguientes datos de post:', post);

  const [author, setAuthor] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAuthor = async () => {
      console.log(`[PostCard ${post.id}] Iniciando fetchAuthor para authorId: ${post.authorId}`);
      if (!post || !post.authorId) {
        console.error(`[PostCard ${post.id}] Error: El post no tiene authorId.`);
        return;
      }
      
      try {
        // Asumimos que el autor es siempre un usuario por ahora.
        // La lógica para diferenciar entre usuario y mascota se puede añadir después.
        const response = await api.get(`/public/users/${post.authorId}`);
        console.log(`[PostCard ${post.id}] Respuesta de /public/users/${post.authorId}:`, response);
        setAuthor(response.data);
      } catch (error) {
        console.error(`[PostCard ${post.id}] ERROR FATAL al obtener el autor:`, error);
      }
    };

    fetchAuthor();
  }, [post]);

  // --- RENDERIZADO SEGURO ---
  // Envolvemos todo en un try...catch para evitar que un error aquí rompa toda la app.
  try {
    if (!post || !author) {
      // Muestra un loader o un placeholder mientras se carga el autor.
      return <div>Cargando post...</div>;
    }

    return (
      <div className="post-card">
        <div className="post-header">
          <Link to={`/profile/${author.id}`} className="author-link">
            <img 
              src={author.profilePictureUrl || 'https://placehold.co/50x50/EFEFEF/333333?text=A'} 
              alt={author.name} 
              className="author-avatar"
            />
            <span className="author-name">{author.name || 'Usuario Desconocido'}</span>
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
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error(`[PostCard ${post?.id}] ERROR FATAL DURANTE EL RENDERIZADO:`, renderError);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    return <div style={{color: 'red', border: '1px solid red', padding: '10px', margin: '10px'}}>Ocurrió un error al mostrar este post.</div>;
  }
};

export default PostCard;
