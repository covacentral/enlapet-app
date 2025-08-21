// frontend/src/RescueProfile.jsx
// Versión 1.1: Añade comprobaciones de seguridad para evitar fallos si faltan coordenadas.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import LoadingComponent from './LoadingComponent';
import { Phone, MessageSquare, MapPin, AlertTriangle } from 'lucide-react';

import styles from './RescueProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Hook para centrar el mapa en las coordenadas una vez que cargan.
function useMapCenter(map, center, zoom) {
    useEffect(() => {
        if (map) {
            map.setView(center, zoom);
        }
    }, [map, center, zoom]);
}

function MapView({ center, zoom, radius }) {
    const [map, setMap] = useState(null);
    useMapCenter(map, center, zoom);

    return (
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} whenCreated={setMap}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <Marker position={center} />
            <Circle center={center} radius={radius} pathOptions={{ color: 'red', fillColor: 'red' }} />
        </MapContainer>
    );
}

function RescueProfile() {
    const { epid } = useParams();
    const [petData, setPetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

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
            <h2>Error</h2>
            <p>{error}</p>
            <Link to="/" className={sharedStyles.linkButton}>Volver al inicio de EnlaPet</Link>
        </div>
    );
    if (!petData) return null;

    // --- [COMPROBACIÓN DE SEGURIDAD AÑADIDA] ---
    const hasCoordinates = petData.lastSeen?.coordinates?._latitude && petData.lastSeen?.coordinates?._longitude;
    const position = hasCoordinates ? [petData.lastSeen.coordinates._latitude, petData.lastSeen.coordinates._longitude] : null;

    const WhatsAppButton = ({ phoneNumber }) => {
        if (!phoneNumber) return null;
        const cleanedPhone = phoneNumber.replace(/\D/g, '');
        const whatsappLink = `https://wa.me/${cleanedPhone.startsWith('57') ? cleanedPhone : '57' + cleanedPhone}`;
        return (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={`${sharedStyles.button} ${styles.whatsappButton}`}>
                <Phone size={18} /> Contactar por WhatsApp
            </a>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1>¡SE BUSCA!</h1>
                    <img src={petData.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={petData.name} className={styles.picture} />
                    <h2 className={styles.name}>{petData.name}</h2>
                    <p className={styles.breed}>{petData.breed || 'Raza no especificada'}</p>
                </div>

                <div className={styles.section}>
                    <h3>Última vez visto en:</h3>
                    <p className={styles.address}><MapPin size={16} /> {petData.lastSeen.address || 'Ubicación no especificada'}</p>
                    <div className={styles.mapWrapper}>
                        {/* El mapa solo se renderiza si hay coordenadas */}
                        {position ? (
                            <MapView center={position} zoom={15} radius={petData.lastSeen.radius || 1000} />
                        ) : (
                            <div className={styles.noMapMessage}>
                                <AlertTriangle size={24} />
                                <p>La ubicación exacta no fue proporcionada por el dueño.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Mensaje del Dueño</h3>
                    <p className={styles.message}><MessageSquare size={16} /> "{petData.message}"</p>
                </div>

                <div className={styles.section}>
                    <h3>¿Lo viste?</h3>
                    <p>Contacta a <strong>{petData.ownerName}</strong></p>
                    {petData.contactPhone ? <WhatsAppButton phoneNumber={petData.contactPhone} /> : <p className={styles.noContact}>El dueño ha preferido no compartir su número. Por favor, llévalo a una veterinaria cercana para escanear su placa NFC.</p>}
                </div>

                <footer className={styles.footer}><p>Potenciado por EnlaPet</p></footer>
            </div>
        </div>
    );
}

export default RescueProfile;