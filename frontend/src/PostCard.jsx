// frontend/src/PostCard.jsx
// Versión: 1.3 - Estilizado con App.css
// Utiliza clases CSS del archivo principal para un diseño cohesivo.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import CommentsModal from './CommentsModal';

function PostCard({ post, isLiked, onLikeToggle, onCommentAdded }) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  if (!post || !post.author) return null;

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

  return (
    <>
      {isCommentsModalOpen && (
        <CommentsModal 
          postId={post.id} 
          onClose={() => setIsCommentsModalOpen(false)}
          onCommentAdded={onCommentAdded}
        />
      )}

      <div className="post-card-container">
        <Link to={authorProfileLink} className="post-card-header">
          <img
            src={profilePic}
            alt={post.author.name}
            className="post-author-pic"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/E2E8F0/4A5568?text=:)' }}
          />
          <span className="post-author-name">{post.author.name}</span>
        </Link>

        <div className="post-image-wrapper">
          <img src={post.imageUrl} alt={post.caption} />
        </div>

        <div className="post-card-body">
          <div className="post-actions">
            <button onClick={handleLikeClick} className={`action-button ${isLiked ? 'liked' : ''}`} aria-label="Dar Me Gusta">
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likesCount}</span>
            </button>
            <button onClick={() => setIsCommentsModalOpen(true)} className="action-button" aria-label="Comentar">
              <MessageCircle size={20} />
              <span>{post.commentsCount}</span>
            </button>
          </div>
          <p className="post-caption">{post.caption}</p>
          <p className="post-date">{postDate}</p>
        </div>
      </div>
    </>
  );
}

export default PostCard;
