// frontend/src/RescueProfile.jsx
// Versión 6.1: Corrige el comportamiento del botón "Atrás" para accesos directos.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { Phone, MapPin, AlertTriangle, ChevronDown, Download, Share2, Check } from 'lucide-react';

import styles from './RescueProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ShareButton = ({ onClick, isCopied }) => (
    <button onClick={onClick} className={`${styles.shareButton} ${isCopied ? styles.copied : ''}`}>
        {isCopied ? <Check size={18} /> : <Share2 size={18} />}
        {isCopied ? 'Copiado' : 'Compartir'}
    </button>
);

const DownloadButton = ({ onClick, isLoading }) => (
    <button onClick={onClick} className={styles.downloadButton} disabled={isLoading}>
        <Download size={18} />
        {isLoading ? 'Generando...' : 'Descargar'}
    </button>
);

// --- [COMPONENTE CORREGIDO] ---
const BackButton = () => {
    const navigate = useNavigate();
    const user = auth.currentUser;

    const handleClick = () => {
        // Comprueba si hay un historial de navegación en la sesión actual.
        // `window.history.length > 2` es una forma segura de saber si el usuario
        // navegó desde otra página dentro de nuestra app.
        if (window.history.length > 2) {
            navigate(-1); // Si hay historial, simplemente vuelve atrás.
        } else {
            // Si no hay historial (acceso directo), decide a dónde ir.
            navigate(user ? '/dashboard' : '/'); // Al dashboard si está logueado, si no, al inicio.
        }
    };

    return (
        <button onClick={handleClick} className={styles.backButton}>
            &larr;
        </button>
    );
};

function RescueProfile() {
    const { epid } = useParams();
    const [petData, setPetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    
    const cardRef = useRef(null);

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

    const handleDownload = useCallback(async () => {
        if (cardRef.current === null) return;
        setIsDownloading(true);
        const node = cardRef.current;
        const originalStyle = node.style.backgroundColor;
        try {
          const computedStyle = window.getComputedStyle(node);
          node.style.backgroundColor = computedStyle.backgroundColor;
          const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
          const link = document.createElement('a');
          link.download = `se-busca-${petData?.name || 'mascota'}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error('oops, something went wrong!', err);
          alert('Hubo un error al generar la imagen.');
        } finally {
          node.style.backgroundColor = originalStyle;
          setIsDownloading(false);
        }
    }, [cardRef, petData]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(err => {
            console.error('Error al copiar el enlace: ', err);
            alert('No se pudo copiar el enlace.');
        });
    };

    if (isLoading) return <LoadingComponent text="Cargando aviso de búsqueda..." />;
    if (error) return (
        <div className={styles.pageContainer}>
            <div className={styles.topActions}><BackButton /></div>
            <div className={styles.errorContainer}><h2>Error</h2><p>{error}</p></div>
        </div>
    );
    if (!petData) return null;

    const isGeoPoint = petData.lastSeen?.coordinates?._latitude && petData.lastSeen?.coordinates?._longitude;
    const isSimpleCoords = petData.lastSeen?.latitude && petData.lastSeen?.longitude;
    
    let position = null;
    if (isGeoPoint) {
        position = [petData.lastSeen.coordinates._latitude, petData.lastSeen.coordinates._longitude];
    } else if (isSimpleCoords) {
        position = [petData.lastSeen.latitude, petData.lastSeen.longitude];
    }
    
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
        <div className={styles.pageContainer}>
            <div className={styles.topActions}>
                <BackButton />
                <div className={styles.rightActions}>
                    <ShareButton onClick={handleCopyLink} isCopied={isCopied} />
                    <DownloadButton onClick={handleDownload} isLoading={isDownloading} />
                </div>
            </div>

            <div ref={cardRef} className={`${styles.card} ${isMapVisible ? styles.expanded : ''}`}>
                <div className={styles.header}><h1>¡SE BUSCA!</h1></div>
                <img src={petData.petPictureUrl || 'https://placehold.co/300x300/E2E8F0/4A5568?text=🐾'} alt={petData.name} className={styles.picture} />
                <div className={styles.petInfoCaption}><h2 className={styles.name}>{petData.name}</h2><p className={styles.breed}>{petData.breed || 'Raza no especificada'}</p></div>
                <div className={styles.infoBox + ' ' + styles.clickable} onClick={() => setIsMapVisible(!isMapVisible)}>
                    <div className={styles.icon}><MapPin size={24} /></div>
                    <div className={styles.textContent}><p>Visto por última vez en <strong>{petData.lastSeen.address || 'Ubicación no especificada'}</strong></p></div>
                    <div className={styles.icon} style={{ transform: isMapVisible ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><ChevronDown size={24} /></div>
                </div>
                
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
                
                <div className={styles.infoBox}>
                    <div className={styles.icon}><Phone size={24} /></div>
                    <div className={styles.textContent}><strong>{petData.contactPhone || 'No disponible'}</strong></div>
                    {petData.contactPhone && <WhatsAppButton phoneNumber={petData.contactPhone} />}
                </div>

                <footer className={styles.footer}><p>Potenciado por EnlaPet</p></footer>
            </div>
        </div>
    );
}

export default RescueProfile;