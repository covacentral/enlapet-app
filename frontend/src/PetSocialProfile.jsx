// frontend/src/PetSocialProfile.jsx
// Versión: 1.1 - Integración de Modal
// Integra el modal CreatePostModal y la lógica para abrirlo.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import CreatePostModal from './CreatePostModal'; // 1. Importamos el nuevo modal
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

function PetSocialProfile() {
    const { petId } = useParams();
    const [petProfile, setPetProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOwner, setIsOwner] = useState(false);
    
    // 2. Añadimos estado para controlar la visibilidad del modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchPetProfile = async () => {
        // La primera vez que carga, mostramos el spinner
        if (!petProfile) setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuario no autenticado.");
            
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/public/pets/${petId}`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'No se pudo cargar el perfil de la mascota.');
            }
            
            const data = await response.json();
            // Creamos un objeto de perfil más completo para el modal
            const profileData = {
                id: petId,
                name: data.pet.name,
                breed: data.pet.breed,
                petPictureUrl: data.pet.petPictureUrl,
                ownerId: data.owner.id // Suponiendo que el backend lo envíe en el futuro
            };
            setPetProfile(profileData);

            // Verificamos si el usuario actual es el dueño
            // Esta lógica es temporal y se mejorará
            // setIsOwner(user.uid === data.owner.id);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPetProfile();
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
                    <p>Próximamente: ¡El timeline de momentos de {petProfile.name}!</p>
                </main>

                {/* 3. El botón ahora abre el modal */}
                <button className="create-post-fab" title="Crear Momento" onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon />
                </button>
            </div>

            {/* 4. Renderizamos el modal si isCreateModalOpen es true */}
            {isCreateModalOpen && (
                <CreatePostModal 
                    user={auth.currentUser}
                    petProfile={petProfile}
                    onClose={() => setIsCreateModalOpen(false)}
                    onPostCreated={() => {
                        // Aquí refrescaremos la lista de posts en el futuro
                        console.log('Post creado, refrescando timeline...');
                        fetchPetProfile(); // Refresca los datos del perfil por si acaso
                    }}
                />
            )}
        </>
    );
}

export default PetSocialProfile;
