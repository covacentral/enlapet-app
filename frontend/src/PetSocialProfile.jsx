// frontend/src/PetSocialProfile.jsx
// Versión: 1.2 - Timeline de Posts
// Carga y muestra las publicaciones de la mascota en un timeline.

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import CreatePostModal from './CreatePostModal';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Iconos ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);
const CommentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);


// --- Nuevo Componente para cada Post ---
const PostCard = ({ post }) => {
    return (
        <div className="post-card">
            <img src={post.imageUrl} alt={post.caption} className="post-image" />
            <div className="post-content">
                <p className="post-caption">
                    <strong>{post.authorName}</strong> {post.caption}
                </p>
                <div className="post-actions">
                    <button className="action-button"><HeartIcon /> <span>{post.likesCount}</span></button>
                    <button className="action-button"><CommentIcon /> <span>{post.commentsCount}</span></button>
                </div>
            </div>
        </div>
    );
};


function PetSocialProfile() {
    const { petId } = useParams();
    const [petProfile, setPetProfile] = useState(null);
    const [posts, setPosts] = useState([]); // Estado para guardar los posts
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = async () => {
        if (!petProfile) setIsLoading(true); // Spinner solo en la carga inicial
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado.");
            
            const idToken = await user.getIdToken();
            
            // Hacemos las dos peticiones en paralelo para más eficiencia
            const [profileResponse, postsResponse] = await Promise.all([
                fetch(`${API_URL}/api/public/pets/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
                fetch(`${API_URL}/api/posts/by-author/${petId}`, { headers: { 'Authorization': `Bearer ${idToken}` } })
            ]);

            if (!profileResponse.ok) throw new Error('No se pudo cargar el perfil de la mascota.');
            if (!postsResponse.ok) throw new Error('No se pudieron cargar las publicaciones.');
            
            const profileData = await profileResponse.json();
            const postsData = await postsResponse.json();

            // Guardamos los datos en el estado
            setPetProfile({
                id: petId,
                name: profileData.pet.name,
                breed: profileData.pet.breed,
                petPictureUrl: profileData.pet.petPictureUrl,
                ownerId: profileData.owner.id // Asumimos que el backend lo enviará
            });
            setPosts(postsData);
            
            // Verificamos si el usuario es el dueño
            // setIsOwner(user.uid === profileData.owner.id);
            // Temporalmente, asumimos que es el dueño para poder ver el botón
            setIsOwner(true); 

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [petId]);

    if (isLoading) {
        return <LoadingComponent text="Cargando perfil de la mascota..." />;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!petProfile) {
        return <div>No se encontró el perfil de la mascota.</div>;
    }

    return (
        <>
            <div className="pet-social-profile-container">
                <header className="profile-header">
                    <div className="cover-photo"></div>
                    <div className="profile-details">
                        <div className="profile-picture-container">
                            <img 
                                src={petProfile.petPictureUrl || 'https://via.placeholder.com/150'} 
                                alt={petProfile.name} 
                                className="profile-picture"
                                onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150'; }}
                            />
                        </div>
                        <h1>{petProfile.name}</h1>
                        <p>{petProfile.breed}</p>
                    </div>
                </header>

                <main className="profile-content">
                    <div className="timeline">
                        {posts.length > 0 ? (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        ) : (
                            <p className="no-posts-message">
                                ¡{petProfile.name} todavía no ha compartido ningún momento!
                            </p>
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
                        fetchData(); // Refresca tanto el perfil como los posts
                    }}
                />
            )}
        </>
    );
}

export default PetSocialProfile;
