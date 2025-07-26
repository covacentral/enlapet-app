// frontend/src/PetSocialProfile.jsx
// Versión: 3.1 - Lógica de Edición de Perfil
// Implementa la lógica para abrir el modal de edición de perfil
// cuando el usuario es el dueño de la mascota.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import CreatePostModal from './CreatePostModal';
import PetEditModal from './PetEditModal'; // Importamos el modal de edición
import PostCard from './PostCard';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// [REFINADO] Aceptamos las nuevas props: user y onUpdate
function PetSocialProfile({ user, userProfile, pets, onUpdate }) {
    const { petId } = useParams();
    const [petProfile, setPetProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [likedStatuses, setLikedStatuses] = useState({});
    const [savedStatuses, setSavedStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Estado para el modal de edición
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!petProfile) setIsLoading(true);
        try {
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

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [petId, petProfile, user]);

    useEffect(() => {
        fetchData();
    }, [petId]);

    const handlePostCreated = () => {
      setIsCreateModalOpen(false);
      fetchData();
    };
    
    // [REFINADO] Función para manejar la actualización del perfil de la mascota
    const handlePetUpdate = () => {
      setIsEditModalOpen(false);
      onUpdate(); // Llama a la función del layout para refrescar todo
      fetchData(); // Vuelve a cargar los datos específicos de este perfil
    };

    const handleLikeToggle = async (postId) => {
        const isCurrentlyLiked = !!likedStatuses[postId];
        setLikedStatuses(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) } : p));
    };
    
    const handleSaveToggle = async (postId) => {
        const isCurrentlySaved = !!savedStatuses[postId];
        setSavedStatuses(prev => ({ ...prev, [postId]: !isCurrentlySaved }));
    };

    const handleCommentAdded = (postId) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    };

    const handleFollowToggle = async () => {
        setFollowLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        
        const endpoint = isFollowing 
            ? `${API_URL}/api/profiles/${petId}/unfollow` 
            : `${API_URL}/api/profiles/${petId}/follow`;
        
        const method = isFollowing ? 'DELETE' : 'POST';
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(endpoint, { 
                method, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` 
                },
                body: JSON.stringify({ profileType: 'pet' }) 
            });
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
            <header className="pet-social-profile-container">
                <div className="profile-cover-photo"></div>
                <div className="social-profile-header">
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
                            // [REFINADO] El botón ahora abre el modal de edición
                            <button onClick={() => setIsEditModalOpen(true)} className="profile-action-button follow">Editar Perfil</button> 
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
                </div>
            </header>

            <main className="profile-timeline">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            isLiked={!!likedStatuses[post.id]}
                            isSaved={!!savedStatuses[post.id]}
                            onLikeToggle={handleLikeToggle}
                            onSaveToggle={handleSaveToggle}
                            onCommentAdded={handleCommentAdded}
                        />
                    ))
                ) : (
                    <p className="no-posts-message" style={{padding: '4rem 1rem'}}>
                        ¡{petProfile.name} todavía no ha compartido ningún momento!
                    </p>
                )}
            </main>

            {isOwner && (
                <button className="create-post-fab" title="Crear Momento" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus />
                </button>
            )}

            {isCreateModalOpen && (
                <CreatePostModal 
                    userProfile={userProfile}
                    pets={pets}
                    initialAuthor={petProfile}
                    onClose={() => setIsCreateModalOpen(false)}
                    onPostCreated={handlePostCreated}
                />
            )}
            
            {/* [REFINADO] Renderizado condicional del modal de edición */}
            {isEditModalOpen && (
                <PetEditModal 
                    pet={petProfile}
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={handlePetUpdate}
                />
            )}
        </>
    );
}

export default PetSocialProfile;
