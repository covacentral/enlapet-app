// frontend/src/PostCard.jsx
// Versión: 1.2 - Bug de Like Corregido y Comentarios
// Corrige el bug visual del ícono de 'like' y abre el modal de comentarios.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import CommentsModal from './CommentsModal'; // Importamos el nuevo modal

function PostCard({ post, isLiked, onLikeToggle, onCommentAdded }) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  if (!post || !post.author) {
    return null;
  }

  const profilePic = post.author.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)';
  const postDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const authorProfileLink = `/dashboard/pet/${post.author.id}`;

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onLikeToggle(post.id);
  };

  const handleOpenComments = () => {
    setIsCommentsModalOpen(true);
  };

  return (
    <>
      {isCommentsModalOpen && (
        <CommentsModal 
          postId={post.id} 
          onClose={() => setIsCommentsModalOpen(false)}
          onCommentAdded={onCommentAdded}
        />
      )}

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
            <button 
              onClick={handleLikeClick}
              className={`flex items-center mr-6 transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
              aria-label="Dar Me Gusta"
            >
              {/* CORRECCIÓN: El atributo 'fill' ahora se controla directamente */}
              <Heart size={20} className="mr-2" fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likesCount}</span>
            </button>
            
            <button 
              onClick={handleOpenComments}
              className="flex items-center hover:text-blue-500 transition-colors" 
              aria-label="Comentar"
            >
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
    </>
  );
}

export default PostCard;
