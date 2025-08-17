// frontend/src/PetSocialProfile.jsx
// Versión 3.4: Integra el diario de hitos (misiones completadas).

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import PetEditModal from './PetEditModal';
import PostCard from './PostCard';
import PetMissionLog from './components/PetMissionLog'; // Importamos el nuevo componente

import styles from './PetSocialProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function PetSocialProfile({ user, onUpdate }) {
    const { petId } = useParams();
    const [activeTab, setActiveTab] = useState('posts');
    
    const [petProfile, setPetProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [likedStatuses, setLikedStatuses] = useState({});
    const [savedStatuses, setSavedStatuses] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    }, [petId, user, petProfile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handlePetUpdate = () => {
      setIsEditModalOpen(false);
      onUpdate(); // Notifica al layout principal para refrescar datos globales
      fetchData(); // Vuelve a cargar los datos específicos del perfil
    };

    const handleLikeToggle = (postId) => {
        const isCurrentlyLiked = !!likedStatuses[postId];
        setLikedStatuses(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, likesCount: p.likesCount + (isCurrentlyLiked ? -1 : 1) } : p));
    };
    
    const handleSaveToggle = (postId) => {
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
            setPetProfile(prev => ({...prev, followersCount: prev.followersCount + (isFollowing ? -1 : 1)}));
        } catch (err) {
            console.error("Error toggling follow:", err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (isLoading) return <LoadingComponent text="Cargando perfil de la mascota..." />;
    if (error) return <div className={sharedStyles.responseMessageError} style={{padding: '2rem'}}>{error}</div>;
    if (!petProfile) return <div>No se encontró el perfil.</div>;

    return (
        <>
            <div className={styles.pageContainer}>
                <header className={styles.container}>
                    <div className={styles.coverPhoto}></div>
                    <div className={styles.header}>
                        <div className={styles.details}>
                            <div className={styles.pictureWrapper}>
                                <img 
                                    src={petProfile.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} 
                                    alt={petProfile.name} 
                                    className={styles.picture}
                                />
                            </div>
                            <div className={styles.info}>
                                <h1>{petProfile.name}</h1>
                                <p>{petProfile.breed}</p>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            {isOwner ? (
                                <button onClick={() => setIsEditModalOpen(true)} className={`${sharedStyles.button} ${sharedStyles.primary}`}>Editar Perfil</button>
                            ) : (
                                <button 
                                    className={`${sharedStyles.button} ${isFollowing ? sharedStyles.secondary : sharedStyles.primary}`} 
                                    onClick={handleFollowToggle} 
                                    disabled={followLoading}
                                >
                                    {followLoading ? '...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <div className={sharedStyles.modalTabs} style={{borderRadius: 0, marginTop: '1rem'}}>
                    <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'posts' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('posts')}>Publicaciones</button>
                    <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'missions' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('missions')}>Diario de Hitos</button>
                </div>

                <main className={styles.profileContent}>
                    {activeTab === 'posts' && (
                        posts.length > 0 ? (
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
                            <p className={styles.noPostsMessage}>¡{petProfile.name} todavía no ha compartido ningún momento!</p>
                        )
                    )}
                    
                    {activeTab === 'missions' && <PetMissionLog petId={petId} />}
                </main>
            </div>

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