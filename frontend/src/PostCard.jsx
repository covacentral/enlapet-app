// frontend/src/PostCard.jsx
// Versión: 2.2 - Refactorización a CSS Modules
// CAMBIO: Se importa y utiliza un módulo de CSS local (PostCard.module.css)
// en lugar de clases globales.

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MoreVertical } from 'lucide-react';
import CommentsModal from './CommentsModal';
import ReportModal from './ReportModal';
import styles from './PostCard.module.css'; // <-- 1. Importamos el módulo de estilos

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
      
      {isReportModalOpen && ( 
        <ReportModal 
          contentId={post.id}
          contentType="post"
          contentCreatorName={post.author.name}
          onClose={() => setIsReportModalOpen(false)} 
        /> 
      )}

      {/* --- 2. Se actualizan todas las clases para usar el objeto 'styles' --- */}
      <div className={styles.postCardContainer}>
        <div className={styles.postCardHeader}>
          <Link to={authorProfileLink} className={styles.postAuthorInfo}>
            <img src={profilePic} alt={post.author.name} className={styles.postAuthorPic}/>
            <span className={styles.postAuthorName}>{post.author.name}</span>
          </Link>
          
          <div className={styles.postMenuContainer} ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={styles.actionButton}>
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className={styles.postMenuDropdown}>
                <button onClick={handleOpenReportModal}>Reportar publicación</button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.postImageWrapper}>
          <img src={post.imageUrl} alt={post.caption} />
        </div>
        <div className={styles.postCardBody}>
          <div className={styles.postActions}>
            <button onClick={handleLikeClick} className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`} aria-label="Dar Me Gusta">
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{post.likesCount}</span>
            </button>
            <button onClick={() => setIsCommentsModalOpen(true)} className={styles.actionButton} aria-label="Comentar">
              <MessageCircle size={20} />
              <span>{post.commentsCount}</span>
            </button>
            <button onClick={handleSaveClick} className={`${styles.actionButton} ${styles.saveButton} ${isSaved ? styles.saved : ''}`} aria-label="Guardar">
              <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>
          <p className={styles.postCaption}>{post.caption}</p>
          <p className={styles.postDate}>{postDate}</p>
        </div>
      </div>
    </>
  );
}

export default PostCard;