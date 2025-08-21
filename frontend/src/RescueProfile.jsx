// frontend/src/RescueProfile.jsx
// Versión 3.0: Rediseño a "Cartel Digital Compacto" para optimización visual.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { MessageSquare, MapPin, AlertTriangle, ChevronDown } from 'lucide-react';

import styles from './RescueProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- Componente de Botón de Navegación Universal (sin cambios) ---
const BackButton = () => {
    const navigate = useNavigate();
    const user = auth.currentUser;

    const handleClick = () => {
        if (user) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <button onClick={handleClick} className={styles.backButton}>
            &larr; {user ? 'Atrás' : 'Ir a EnlaPet'}
        </button>
    );
};

// --- Componente principal con JSX reestructurado ---
function RescueProfile() {
    const { epid } = useParams();
    const [petData, setPetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMapVisible, setIsMapVisible] = useState(false);

    const fetchRescueProfile = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/public/rescue/${epid}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'No se pudo encontrar el perfil de rescate.');
            setPetData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [epid]);

    useEffect(() => {
        fetchRescueProfile();
    }, [fetchRescueProfile]);

    if (isLoading) return <LoadingComponent text="Cargando aviso de búsqueda..." />;
    if (error) return (
        <div className={`${styles.container} ${styles.errorContainer}`}>
            <BackButton />
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/" className={sharedStyles.linkButton}>Volver al inicio de EnlaPet</Link>
        </div>
    );
    if (!petData) return null;

    const hasCoordinates = petData.lastSeen?.coordinates?._latitude && petData.lastSeen?.coordinates?._longitude;
    const position = hasCoordinates ? [petData.lastSeen.coordinates._latitude, petData.lastSeen.coordinates._longitude] : null;
    
    // --- Botón de WhatsApp rediseñado sin ícono ---
    const WhatsAppButton = ({ phoneNumber }) => {
        if (!phoneNumber) return null;
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        const whatsappLink = `https://wa.me/${cleanedPhone.startsWith('57') ? cleanedPhone : '57' + cleanedPhone}`;
        return (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`${sharedStyles.button} ${styles.whatsappButton}`}>
                WhatsApp
            </a>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <BackButton />
                
                <div className={styles.header}>
                    <h1>¡SE BUSCA!</h1>
                </div>

                <img src={petData.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={petData.name} className={styles.picture} />
                
                {/* --- Nombre y raza como pie de foto --- */}
                <div className={styles.petInfoCaption}>
                    <h2 className={styles.name}>{petData.name}</h2>
                    <p className={styles.breed}>{petData.breed || 'Raza no especificada'}</p>
                </div>

                {/* --- Mensaje del dueño reubicado --- */}
                <p className={styles.message}><MessageSquare size={16} /> "{petData.message}"</p>

                {/* --- Sección de contacto sin título explícito --- */}
                <div className={styles.section}>
                    <div className={styles.contactSection}>
                        <p>Contacta a <strong>{petData.ownerName}</strong></p>
                        {petData.contactPhone ? (
                            <div className={styles.contactInfo}>
                                <span>{petData.contactPhone}</span>
                                <WhatsAppButton phoneNumber={petData.contactPhone} />
                            </div>
                        ) : (
                            <p className={styles.noContact}>El dueño ha preferido no compartir su número. Por favor, llévalo a una veterinaria cercana para escanear su placa NFC.</p>
                        )}
                    </div>
                </div>

                {/* --- Acordeón del mapa --- */}
                <div className={styles.section}>
                    <button className={styles.locationToggle} onClick={() => setIsMapVisible(!isMapVisible)}>
                        <MapPin size={16} /> 
                        <span>Última vez visto en: {petData.lastSeen.address || 'Ubicación no especificada'}</span>
                        <ChevronDown size={20} style={{ marginLeft: 'auto', transform: isMapVisible ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {isMapVisible && (
                        <div className={styles.mapWrapper}>
                            {position ? (
                                <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
                                    <Marker position={position} />
                                    <Circle center={position} radius={petData.lastSeen.radius || 1000} pathOptions={{ color: 'red', fillColor: 'red' }} />
                                </MapContainer>
                            ) : (
                                <div className={styles.noMapMessage}><AlertTriangle size={24} /><p>La ubicación exacta no fue proporcionada.</p></div>
                            )}
                        </div>
                    )}
                </div>

                <footer className={styles.footer}>
                    <p>Potenciado por EnlaPet</p>
                </footer>
            </div>
        </div>
    );
}

export default RescueProfile;