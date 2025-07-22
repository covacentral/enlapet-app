// frontend/src/PetSocialProfile.jsx
// Versión: 1.6 - Renderizado Condicional
// Evita el bucle de errores al mostrar un placeholder si no hay imagen de perfil.

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import CreatePostModal from './CreatePostModal';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Iconos ---
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
const HeartIcon = ({ isLiked }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLiked ? 'liked' : ''}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> );
const CommentIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> );

// --- Componente para un solo comentario (con renderizado condicional) ---
const Comment = ({ comment }) => (
    <div className="comment">
        {comment.authorProfilePic ? (
            <img src={comment.authorProfilePic} alt={comment.authorName} className="comment-author-pic" />
        ) : (
            <div className="comment-author-pic-placeholder">👤</div>
        )}
        <div className="comment-content">
            <p>
                <strong>{comment.authorName}</strong>
                <span>{comment.text}</span>
            </p>
        </div>
    </div>
);

// --- Componente PostCard (sin cambios) ---
const PostCard = ({ post, isLikedInitially, onLikeToggle }) => {
    const [isLiked, setIsLiked] = useState(isLikedInitially);
    const [likesCount, setLikesCount] = useState(post.likesCount);
    const [comments, setComments] = useState([]);
    const [commentsCount, setCommentsCount] = useState(post.commentsCount);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleLike = () => {
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1);
        onLikeToggle(post.id, newIsLiked);
    };

    const fetchComments = async () => {
        if (comments.length > 0) return;
        try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const handleToggleComments = () => {
        const newShowComments = !showComments;
        setShowComments(newShowComments);
        if (newShowComments) {
            fetchComments();
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmittingComment(true);
        try {
            const user = auth.currentUser;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/posts/${post.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ text: newComment })
            });
            if (response.ok) {
                const addedComment = await response.json();
                setComments([...comments, addedComment]);
                setCommentsCount(commentsCount + 1);
                setNewComment('');
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    return (
        <div className="post-card">
            <img src={post.imageUrl} alt={post.caption} className="post-image" />
            <div className="post-content">
                <p className="post-caption">
                    <strong>{post.authorName}</strong> {post.caption}
                </p>
                <div className="post-actions">
                    <button className="action-button" onClick={handleLike}>
                        <HeartIcon isLiked={isLiked} /> <span>{likesCount}</span>
                    </button>
                    <button className="action-button" onClick={handleToggleComments}>
                        <CommentIcon /> <span>{commentsCount}</span>
                    </button>
                </div>
                {showComments && (
                    <div className="comments-section">
                        <div className="comments-list">
                            {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                        </div>
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <input 
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Añade un comentario..."
                                disabled={isSubmittingComment}
                            />
                            <button type="submit" disabled={isSubmittingComment}>
                                {isSubmittingComment ? '...' : 'Publicar'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};


function PetSocialProfile() {
    const { petId } = useParams();
    const [petProfile, setPetProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [likedStatuses, setLikedStatuses] = useState({});

    const fetchData = async () => {
        if (!petProfile) setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado.");
            
            const idToken = await user.getIdToken();
            
            const [profileResponse, postsResponse, followStatusResponse] = await Promise.all([
                fetch(`${API_URL}/api/public/pets/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(`${API_URL}/api/posts/by-author/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(`${API_URL}/api/profiles/${petId}/follow-status`, { headers: { 'Authorization': `Bearer ${idToken}` } })
            ]);

            if (!profileResponse.ok) throw new Error('No se pudo cargar el perfil de la mascota.');
            if (!postsResponse.ok) throw new Error('No se pudieron cargar las publicaciones.');
            if (!followStatusResponse.ok) throw new Error('No se pudo verificar el estado de seguimiento.');
            
            const profileData = await profileResponse.json();
            const postsData = await postsResponse.json();
            const followStatusData = await followStatusResponse.json();

            setPetProfile({
                id: petId, name: profileData.pet.name, breed: profileData.pet.breed,
                petPictureUrl: profileData.pet.petPictureUrl, ownerId: profileData.owner.id
            });
            setPosts(postsData);
            setIsFollowing(followStatusData.isFollowing);
            setIsOwner(user.uid === profileData.owner.id);

            if (postsData.length > 0) {
                const postIds = postsData.map(p => p.id);
                const likeStatusResponse = await fetch(`${API_URL}/api/posts/like-statuses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ postIds })
                });
                if (likeStatusResponse.ok) {
                    const statuses = await likeStatusResponse.json();
                    setLikedStatuses(statuses);
                }
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [petId]);

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const endpoint = isFollowing ? `${API_URL}/api/profiles/${petId}/unfollow` : `${API_URL}/api/profiles/${petId}/follow`;
        const method = isFollowing ? 'DELETE' : 'POST';
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(endpoint, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
            if (!response.ok) throw new Error('La acción no se pudo completar.');
            setIsFollowing(!isFollowing);
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    const handleLikeToggle = async (postId, shouldLike) => {
        const user = auth.currentUser;
        if (!user) return;
        const endpoint = shouldLike ? `${API_URL}/api/posts/${postId}/like` : `${API_URL}/api/posts/${postId}/unlike`;
        const method = shouldLike ? 'POST' : 'DELETE';
        try {
            const idToken = await user.getIdToken();
            await fetch(endpoint, {
                method: method,
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
        } catch (err) {
            console.error("Error toggling like:", err);
        }
    };

    if (isLoading) return <LoadingComponent text="Cargando perfil de la mascota..." />;
    if (error) return <div className="error-message">{error}</div>;
    if (!petProfile) return <div>No se encontró el perfil de la mascota.</div>;

    return (
        <>
            <div className="pet-social-profile-container">
                <header className="profile-header">
                    <div className="cover-photo"></div>
                    <div className="profile-details">
                        <div className="profile-picture-container">
                            {petProfile.petPictureUrl ? (
                                <img src={petProfile.petPictureUrl} alt={petProfile.name} className="profile-picture" />
                            ) : (
                                <div className="profile-picture-placeholder">🐾</div>
                            )}
                        </div>
                        <h1>{petProfile.name}</h1>
                        <p>{petProfile.breed}</p>
                        <div className="profile-actions">
                            {isOwner ? ( <button className="profile-action-button edit">Editar Perfil</button> ) : (
                                <button className={`profile-action-button ${isFollowing ? 'following' : 'follow'}`} onClick={handleFollowToggle} disabled={followLoading}>
                                    {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="profile-content">
                    <div className="timeline">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    isLikedInitially={likedStatuses[post.id] || false}
                                    onLikeToggle={handleLikeToggle}
                                />
                            ))
                        ) : (
                            <p className="no-posts-message">¡{petProfile.name} todavía no ha compartido ningún momento!</p>
                        )}
                    </div>
                </main>

                {isOwner && (
                    <button className="create-post-fab" title="Crear Momento" onClick={() => setIsCreateModalOpen(true)}>
                        <PlusIcon />
                    </button>
                )}
            </div>

            {isCreateModalOpen && (
                <CreatePostModal 
                    user={auth.currentUser}
                    petProfile={petProfile}
                    onClose={() => setIsCreateModalOpen(false)}
                    onPostCreated={() => {
                        console.log('Post creado, refrescando timeline...');
                        fetchData();
                    }}
                />
            )}
        </>
    );
}

export default PetSocialProfile;
