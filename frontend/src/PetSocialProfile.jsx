// frontend/src/PetSocialProfile.jsx
// Versión: 2.1 - Timeline Restaurado y Unificado
// Corrige el bug que impedía mostrar los posts en el perfil.
// Enriquece los datos de los posts localmente para que coincidan con la estructura que espera PostCard.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import CreatePostModal from './CreatePostModal';
import PostCard from './PostCard';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PetSocialProfile() {
    const { petId } = useParams();
    const [petProfile, setPetProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [likedStatuses, setLikedStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado.");
            const idToken = await user.getIdToken();
            
            const [profileRes, postsRes, followStatusRes] = await Promise.all([
                fetch(`${API_URL}/api/public/pets/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(`${API_URL}/api/posts/by-author/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(`${API_URL}/api/profiles/${petId}/follow-status`, { headers: { 'Authorization': `Bearer ${idToken}` } })
            ]);

            if (!profileRes.ok) throw new Error('No se pudo cargar el perfil.');
            const profileData = await profileRes.json();
            setPetProfile(profileData.pet);
            setIsOwner(user.uid === profileData.pet.ownerId);

            if (!postsRes.ok) throw new Error('No se pudieron cargar las publicaciones.');
            let postsData = await postsRes.json();

            // *** LA CORRECCIÓN CLAVE ESTÁ AQUÍ ***
            // Añadimos manualmente el objeto 'author' a cada post, ya que la API no lo hace.
            const enrichedPosts = postsData.map(post => ({
                ...post,
                author: {
                    id: profileData.pet.id,
                    name: profileData.pet.name,
                    profilePictureUrl: profileData.pet.petPictureUrl
                }
            }));
            setPosts(enrichedPosts);

            if (!followStatusRes.ok) throw new Error('Error al verificar seguimiento.');
            const followStatusData = await followStatusRes.json();
            setIsFollowing(followStatusData.isFollowing);

            if (postsData.length > 0) {
                const postIds = postsData.map(p => p.id);
                const response = await fetch(`${API_URL}/api/posts/like-statuses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                    body: JSON.stringify({ postIds })
                });
                if (response.ok) setLikedStatuses(await response.json());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [petId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // El resto de los manejadores (handleLikeToggle, handleCommentAdded, etc.) no necesitan cambios
    const handleLikeToggle = async (postId) => {
        const isCurrentlyLiked = !!likedStatuses[postId];
        setLikedStatuses(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => 
            p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) } : p
        ));
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            const endpoint = isCurrentlyLiked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`;
            const method = isCurrentlyLiked ? 'DELETE' : 'POST';
            await fetch(`${API_URL}${endpoint}`, { method, headers: { 'Authorization': `Bearer ${idToken}` } });
        } catch (error) {
            setLikedStatuses(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
            setPosts(prevPosts => prevPosts.map(p => 
                p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? 1 : -1) } : p
            ));
        }
    };

    const handleCommentAdded = (postId) => {
        setPosts(prevPosts => prevPosts.map(p => 
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ));
    };

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const endpoint = isFollowing ? `/api/profiles/${petId}/unfollow` : `/api/profiles/${petId}/follow`;
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

    if (isLoading) return <LoadingComponent text="Cargando perfil de la mascota..." />;
    if (error) return <div className="error-message">{error}</div>;
    if (!petProfile) return <div>No se encontró el perfil.</div>;

    return (
        <>
            <div className="pet-social-profile-container">
                <header className="social-profile-header">
                    <div className="profile-cover-photo"></div>
                    <div className="social-profile-details">
                        <div className="social-profile-picture-wrapper">
                            <img 
                                src={petProfile.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} 
                                alt={petProfile.name} 
                                className="social-profile-picture"
                            />
                        </div>
                        <div className="social-profile-info">
                            <h1>{petProfile.name}</h1>
                            <p>{petProfile.breed}</p>
                        </div>
                    </div>
                     <div className="social-profile-actions">
                        {isOwner ? ( 
                            <button className="profile-action-button follow">Editar Perfil</button> 
                        ) : (
                            <button 
                                className={`profile-action-button ${isFollowing ? 'following' : 'follow'}`} 
                                onClick={handleFollowToggle} 
                                disabled={followLoading}
                            >
                                {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                            </button>
                        )}
                    </div>
                </header>

                <main className="profile-timeline">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isLiked={!!likedStatuses[post.id]}
                                onLikeToggle={handleLikeToggle}
                                onCommentAdded={handleCommentAdded}
                            />
                        ))
                    ) : (
                        <p className="no-posts-message" style={{padding: '4rem 1rem'}}>
                            ¡{petProfile.name} todavía no ha compartido ningún momento!
                        </p>
                    )}
                </main>
            </div>

            {isOwner && (
                <button className="create-post-fab" title="Crear Momento" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus />
                </button>
            )}

            {isCreateModalOpen && (
                <CreatePostModal 
                    user={auth.currentUser}
                    petProfile={petProfile}
                    onClose={() => setIsCreateModalOpen(false)}
                    onPostCreated={fetchData}
                />
            )}
        </>
    );
}

export default PetSocialProfile;
