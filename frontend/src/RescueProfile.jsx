// frontend/src/RescueProfile.jsx
// Versión 5.0: Añade la funcionalidad para descargar el cartel de búsqueda como imagen PNG.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { Phone, MapPin, AlertTriangle, ChevronDown, Download } from 'lucide-react';

import styles from './RescueProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- [NUEVO] Componente de Botón de Descarga ---
const DownloadButton = ({ onClick, isLoading }) => (
    <button onClick={onClick} className={styles.downloadButton} disabled={isLoading}>
        <Download size={18} />
        {isLoading ? 'Generando...' : 'Descargar Aviso'}
    </button>
);

const BackButton = () => {
    const navigate = useNavigate();
    const user = auth.currentUser;
    const handleClick = () => user ? navigate(-1) : navigate('/');
    return (
        <button onClick={handleClick} className={styles.backButton}>
            &larr; {user ? 'Atrás' : 'Ir a EnlaPet'}
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
    
    // 1. Creamos la referencia para el cartel.
    const cardRef = useRef(null);

    const fetchRescueProfile = useCallback(async () => {
        // ... (lógica de fetch sin cambios)
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

    // 2. Implementamos la lógica de descarga.
    const handleDownload = useCallback(async () => {
        if (cardRef.current === null) {
          return;
        }
        setIsDownloading(true);
        try {
          const dataUrl = await toPng(cardRef.current, { 
              cacheBust: true,
              backgroundColor: 'transparent' // Clave para los bordes redondeados
          });
    
          // Creamos un enlace temporal para iniciar la descarga
          const link = document.createElement('a');
          link.download = `se-busca-${petData?.name || 'mascota'}.png`;
          link.href = dataUrl;
          link.click();

        } catch (err) {
          console.error('oops, something went wrong!', err);
          alert('Hubo un error al generar la imagen.');
        } finally {
          setIsDownloading(false);
        }
      }, [cardRef, petData]);


    if (isLoading) return <LoadingComponent text="Cargando aviso de búsqueda..." />;
    if (error) return (
        <div className={styles.pageContainer}>
            <div className={styles.topActions}><BackButton /></div>
            <div className={styles.errorContainer}><h2>Error</h2><p>{error}</p></div>
        </div>
    );
    if (!petData) return null;

    const hasCoordinates = petData.lastSeen?.coordinates?._latitude && petData.lastSeen?.coordinates?._longitude;
    const position = hasCoordinates ? [petData.lastSeen.coordinates._latitude, petData.lastSeen.coordinates._longitude] : null;
    
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
            {/* 3. Agrupamos los botones de acción en la parte superior */}
            <div className={styles.topActions}>
                <BackButton />
                <DownloadButton onClick={handleDownload} isLoading={isDownloading} />
            </div>

            {/* 4. Asignamos la referencia (ref) al div del cartel */}
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