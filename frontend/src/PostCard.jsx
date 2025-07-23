// frontend/src/PostCard.jsx
// Versión: 1.1 - Componente Interactivo
// Recibe y gestiona el estado de 'like' y notifica las interacciones.

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';

// El componente ahora recibe propiedades adicionales para la interactividad
function PostCard({ post, isLiked, onLikeToggle }) {
  if (!post || !post.author) {
    return null;
  }

  const profilePic = post.author.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)';
  const postDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const authorProfileLink = `/dashboard/pet/${post.author.id}`;

  const handleLikeClick = (e) => {
    // Detenemos la propagación para evitar que el clic active otros elementos, como la navegación.
    e.preventDefault();
    e.stopPropagation();
    // Llamamos a la función que nos pasó el componente padre (FeedPage)
    onLikeToggle(post.id);
  };

  return (
    <div className="post-card-container bg-white border border-gray-200 rounded-lg shadow-sm mb-6 max-w-xl mx-auto">
      <Link to={authorProfileLink} className="flex items-center p-4 hover:bg-gray-50 rounded-t-lg">
        <img
          src={profilePic}
          alt={`Perfil de ${post.author.name}`}
          className="w-10 h-10 rounded-full object-cover mr-4"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/4A5568?text=:)' }}
        />
        <span className="font-bold text-gray-800">{post.author.name}</span>
      </Link>

      <div className="post-image-wrapper">
        <img
          src={post.imageUrl}
          alt={`Publicación de ${post.author.name}: ${post.caption}`}
          className="w-full h-auto object-cover"
          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/E2E8F0/4A5568?text=Imagen+no+disponible' }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center text-gray-500 mb-2">
          {/* El botón de Like ahora es dinámico */}
          <button 
            onClick={handleLikeClick}
            className={`flex items-center mr-6 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            aria-label="Dar Me Gusta"
          >
            <Heart size={20} className={`mr-2 ${isLiked ? 'fill-current' : ''}`} />
            {/* El contador de likes se actualiza en tiempo real */}
            <span>{post.likesCount}</span>
          </button>
          
          <button className="flex items-center hover:text-blue-500 transition-colors" aria-label="Comentar">
            <MessageCircle size={20} className="mr-2" />
            <span>{post.commentsCount}</span>
          </button>
        </div>

        <p className="text-gray-700 mb-4">
          {post.caption}
        </p>
        
        <p className="text-xs text-gray-400 mt-4">{postDate}</p>
      </div>
    </div>
  );
}

export default PostCard;
