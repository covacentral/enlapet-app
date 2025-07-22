// frontend/src/PetSocialProfile.jsx
// Versión: 1.0 - Base
// Componente inicial para el perfil social de la mascota dentro de la aplicación.

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Icono para el botón de "Crear Momento"
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

    useEffect(() => {
        const fetchPetProfile = async () => {
            setIsLoading(true);
            try {
                const user = auth.currentUser;
                if (!user) {
                    throw new Error("Usuario no autenticado.");
                }
                const idToken = await user.getIdToken();
                
                // Usamos el endpoint público para cargar los datos básicos.
                const response = await fetch(`${API_URL}/api/public/pets/${petId}`, {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'No se pudo cargar el perfil de la mascota.');
                }
                
                const data = await response.json();
                setPetProfile(data);

                // Aquí verificaremos si el usuario es el dueño.
                // Esta lógica se mejorará cuando tengamos un endpoint privado para perfiles.
                // Por ahora, asumimos que si puede ver este perfil, es el dueño.
                // setIsOwner(user.uid === data.owner.id);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

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
        <div className="pet-social-profile-container">
            <header className="profile-header">
                <div className="cover-photo">
                    {/* Espacio para la foto de portada */}
                </div>
                <div className="profile-details">
                    <div className="profile-picture-container">
                        <img 
                            src={petProfile.pet.petPictureUrl || 'https://via.placeholder.com/150'} 
                            alt={petProfile.pet.name} 
                            className="profile-picture"
                            onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/150'; }}
                        />
                    </div>
                    <h1>{petProfile.pet.name}</h1>
                    <p>{petProfile.pet.breed}</p>
                    {/* Espacio para botones de Seguir/Editar */}
                </div>
            </header>

            <main className="profile-content">
                {/* Espacio para las pestañas de Momentos, Galería, etc. */}
                <p>Próximamente: ¡El timeline de momentos de {petProfile.pet.name}!</p>
            </main>

            {/* Botón flotante para crear una nueva publicación */}
            <button className="create-post-fab" title="Crear Momento">
                <PlusIcon />
            </button>
        </div>
    );
}

export default PetSocialProfile;
