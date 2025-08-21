// frontend/src/PetSocialProfile.jsx
// Versión 3.7: Corrige la concatenación de clases CSS en la vista del dueño.

import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auth } from './firebase';
import styles from './PetSocialProfile.module.css';
import sharedStyles from './shared.module.css';
import { Calendar, Droplet, ShieldCheck, Stethoscope, Mail, Heart, MessageCircle, ArrowLeft, Edit } from 'lucide-react';
import LoadingComponent from './LoadingComponent';
import PetMissionLog from './components/PetMissionLog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fetchPetProfile = async (petId) => {
    const user = auth.currentUser;
    let headers = {};
    if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
    }
    const response = await fetch(`${API_URL}/api/pets/${petId}/profile`, { headers });
    if (!response.ok) {
        const publicResponse = await fetch(`${API_URL}/api/public/pets/${petId}`);
        if (!publicResponse.ok) throw new Error('Mascota no encontrada');
        return publicResponse.json();
    }
    return response.json();
};

const fetchPetPosts = async (petId) => {
    const response = await fetch(`${API_URL}/api/posts/author/${petId}`);
    if (!response.ok) {
        throw new Error('No se pudieron cargar las publicaciones');
    }
    return response.json();
};

function PetSocialProfile({ user, onUpdate }) {
    const { petId } = useParams();
    const navigate = useNavigate();

    const { data: profile, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useQuery(
        ['petProfile', petId], 
        () => fetchPetProfile(petId),
        { staleTime: 5 * 60 * 1000 }
    );
    const { data: posts, isLoading: isLoadingPosts, error: postsError } = useQuery(
        ['petPosts', petId], 
        () => fetchPetPosts(petId),
        { staleTime: 5 * 60 * 1000 }
    );

    if (isLoadingProfile || isLoadingPosts) {
        return <LoadingComponent text="Cargando perfil de la mascota..." />;
    }
    if (profileError) {
        return <div className={sharedStyles.responseMessageError}>{profileError.message}</div>;
    }

    const { pet, owner } = profile;
    const isOwner = user && user.uid === owner.id;

    const InfoCard = ({ icon, title, children }) => (
        <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
                {icon}
                <h4>{title}</h4>
            </div>
            <div className={styles.infoCardContent}>{children}</div>
        </div>
    );

    return (
        <div className={styles.profileContainer}>
            <button onClick={() => navigate(-1)} className={styles.backLink}><ArrowLeft /> Volver</button>

            {/* --- LÍNEA CORREGIDA --- */}
            {/* Se añade un espacio en la plantilla de string para separar las clases. */}
            <header className={`${styles.header} ${isOwner ? styles.ownerView : ''}`}>
                <img src={pet.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={pet.name} className={styles.profilePicture} />
                <div className={styles.headerInfo}>
                    <div className={styles.nameContainer}>
                        <h1 className={styles.petName}>{pet.name}</h1>
                        {isOwner && (
                            <Link to="/dashboard/pets" className={styles.editButton} title="Editar Mascota">
                                <Edit size={18} />
                            </Link>
                        )}
                    </div>
                    <p className={styles.petBreed}>{pet.breed}</p>
                    <div className={styles.ownerInfo}>
                        <span>Responsable:</span>
                        <Link to={`/dashboard/user/${owner.id}`} className={styles.ownerNameLink}>{owner.name}</Link>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.statItem}><Heart size={16} /><span>{pet.followersCount || 0} Seguidores</span></div>
                        <div className={styles.statItem}><MessageCircle size={16} /><span>{posts?.length || 0} Momentos</span></div>
                    </div>
                </div>
                {!isOwner && (
                    <div className={styles.headerActions}>
                        <button className={`${sharedStyles.button} ${sharedStyles.primary}`}>Seguir</button>
                        <button className={`${sharedStyles.button} ${sharedStyles.secondary}`}>Enviar Mensaje</button>
                    </div>
                )}
            </header>

            <main className={styles.mainContent}>
                <div className={styles.leftColumn}>
                    <InfoCard icon={<Calendar size={20} />} title="Información Básica">
                        <p><strong>Fecha de Nacimiento:</strong> {pet.healthRecord.birthDate || 'No especificado'}</p>
                        <p><strong>Género:</strong> {pet.healthRecord.gender || 'No especificado'}</p>
                        <p><strong>Ubicación:</strong> {`${pet.location.city}, ${pet.location.department}` || 'No especificado'}</p>
                    </InfoCard>

                    <InfoCard icon={<ShieldCheck size={20} />} title="Vacunas">
                        {pet.healthRecord.vaccines && pet.healthRecord.vaccines.length > 0 ? (
                            <ul className={styles.vaccineList}>
                                {pet.healthRecord.vaccines.map((vaccine, index) => (
                                    <li key={index}><strong>{vaccine.name}:</strong> Aplicada el {vaccine.date}</li>
                                ))}
                            </ul>
                        ) : <p>No hay vacunas registradas.</p>}
                    </InfoCard>

                    <InfoCard icon={<Stethoscope size={20} />} title="Historial Médico">
                        {pet.healthRecord.medicalHistory && pet.healthRecord.medicalHistory.length > 0 ? (
                            <ul className={styles.historyList}>
                                {pet.healthRecord.medicalHistory.map((entry, index) => (
                                    <li key={index}>
                                        <strong>{entry.date}:</strong> {entry.description}
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Sin historial médico registrado.</p>}
                    </InfoCard>

                    <PetMissionLog petId={petId} isOwner={isOwner} />

                </div>
                <div className={styles.rightColumn}>
                    <h3 className={styles.postsTitle}>Momentos de {pet.name}</h3>
                    {postsError ? (
                        <p className={sharedStyles.responseMessageError}>No se pudieron cargar los momentos.</p>
                    ) : posts && posts.length > 0 ? (
                        <div className={styles.postsGrid}>
                            {posts.map(post => (
                                <img key={post.id} src={post.imageUrl} alt="Publicación de la mascota" className={styles.postImage} />
                            ))}
                        </div>
                    ) : (
                        <p>¡{pet.name} todavía no ha compartido ningún momento!</p>
                    )}
                </div>
            </main>
        </div>
    );
}

export default PetSocialProfile;