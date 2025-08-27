// frontend/src/RescueProfile.jsx
// Versión 5.4: Implementa la solución definitiva para la captura de colores de fondo.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { Phone, MapPin, AlertTriangle, ChevronDown, Download } from 'lucide-react';

import styles from './RescueProfile.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
        if (cardRef.current === null) {
          return;
        }
        setIsDownloading(true);
        
        const node = cardRef.current;
        // Guardamos el estilo en línea original para restaurarlo después.
        const originalStyle = node.style.backgroundColor;
        
        try {
          // --- [LÓGICA CORREGIDA Y DEFINITIVA] ---
          // 1. Obtenemos el color de fondo que está realmente renderizado en la pantalla.
          const computedStyle = window.getComputedStyle(node);
          // 2. Aplicamos ese color directamente como un estilo en línea al nodo.
          //    Esto anula temporalmente la variable CSS y le da a la librería un valor explícito.
          node.style.backgroundColor = computedStyle.backgroundColor;

          const dataUrl = await toPng(node, { 
              cacheBust: true,
              pixelRatio: 2 // Mantenemos la alta calidad
          });
    
          const link = document.createElement('a');
          link.download = `se-busca-${petData?.name || 'mascota'}.png`;
          link.href = dataUrl;
          link.click();

        } catch (err) {
          console.error('oops, something went wrong!', err);
          alert('Hubo un error al generar la imagen.');
        } finally {
          // 3. (MUY IMPORTANTE) En el bloque finally, restauramos el estilo original
          //    para que el componente en pantalla no se vea afectado.
          node.style.backgroundColor = originalStyle;
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
            <div className={styles.topActions}>
                <BackButton />
                <DownloadButton onClick={handleDownload} isLoading={isDownloading} />
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