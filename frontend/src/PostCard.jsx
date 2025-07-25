// frontend/src/PostCard.jsx
// Versión: 2.0 - Enlaces de Autor Dinámicos
// TAREA 5: El enlace del autor ahora dirige al perfil de mascota o de usuario según el 'authorType'.

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreVertical } from 'lucide-react';
import CommentsModal from './CommentsModal';
import ReportModal from './ReportModal';

function PostCard({ post, isLiked, isSaved, onLikeToggle, onSaveToggle, onCommentAdded }) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  if (!post || !post.author) return null;

  // --- LÓGICA DE ENLACE DINÁMICO ---
  const authorProfileLink = post.authorType === 'pet'
    ? `/dashboard/pet/${post.author.id}`
    : `/dashboard/user/${post.author.id}`;

  const profilePic = post.author.profilePictureUrl || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)';
  const postDate = new Date(post.createdAt).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleLikeClick = (e) => { e.preventDefault(); e.stopPropagation(); onLikeToggle(post.id); };
  const handleSaveClick = (e) => { e.preventDefault(); e.stopPropagation(); onSaveToggle(post.id); };
  
  const handleOpenReportModal = () => {
    setIsMenuOpen(false);
    setIsReportModalOpen(true);
  };

  return (
    <>
      {isCommentsModalOpen && ( <CommentsModal postId={post.id} onClose={() => setIsCommentsModalOpen(false)} onCommentAdded={onCommentAdded} /> )}
      {isReportModalOpen && ( <ReportModal post={post} onClose={() => setIsReportModalOpen(false)} /> )}

      <div className="post-card-container">
        <div className="post-card-header">
          <Link to={authorProfileLink} className="post-author-info">
            <img src={profilePic} alt={post.author.name} className="post-author-pic"/>
            <span className="post-author-name">{post.author.name}</span>
          </Link>
          
          <div className="post-menu-container" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="action-button">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="post-menu-dropdown">
                <button onClick={handleOpenReportModal}>Reportar publicación</button>
              </div>
            )}
          </div>
        </div>

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
            <button onClick={handleSaveClick} className={`action-button save-button ${isSaved ? 'saved' : ''}`} aria-label="Guardar">
              <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
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
