// frontend/src/components/RescueModeModal.jsx
// Versión 1.3: Se alinea la importación con la exportación nombrada de 'colombiaData'.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from '../firebase';
import { X, AlertTriangle } from 'lucide-react';
// --- [LÍNEA CORREGIDA] ---
// Se vuelve a una importación nombrada para que coincida con la exportación explícita del archivo de datos.
import { colombiaDepartments } from '../utils/colombiaData';

import styles from './RescueModeModal.module.css';
import sharedStyles from '../shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973]; // Centro de Colombia

function LocationPicker({ onLocationSelect, initialPos }) {
  const [position, setPosition] = useState(initialPos);
  
  const map = useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      onLocationSelect(newPos);
    },
  });

  useEffect(() => {
    if (initialPos) {
      map.setView(initialPos, 13);
    }
  }, [initialPos, map]);

  return position ? <Marker position={position}></Marker> : null;
}

function RescueModeModal({ pet, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    message: pet.rescueMode?.message || `¡Ayúdame a volver a casa! Si me ves, por favor contacta a mi familia.`,
    showContactPhone: pet.rescueMode?.showContactPhone !== false,
    address: pet.rescueMode?.lastSeen?.address || '',
  });
  
  const [initialMapPosition, setInitialMapPosition] = useState(initialPosition);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const petCoords = pet.rescueMode?.lastSeen?.coordinates;
    if (petCoords?._latitude && petCoords?._longitude) {
      const savedPos = { lat: petCoords._latitude, lng: petCoords._longitude };
      setSelectedCoordinates(savedPos);
      setInitialMapPosition(savedPos);
      return;
    }
    
    // --- [LÍNEA CORREGIDA] ---
    // Se usa el nombre de la variable importada correctamente: 'colombiaDepartments'.
    const departmentData = colombiaDepartments.find(d => d.department === pet.location?.department);
    if (departmentData) {
      const cityData = departmentData.cities.find(c => c.name === pet.location?.city);
      if (cityData) {
        setInitialMapPosition([cityData.latitude, cityData.longitude]);
      }
    }
  }, [pet]);

  const handleLocationSelect = (latlng) => {
    setSelectedCoordinates(latlng);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoordinates) {
        setMessage('Error: Por favor, marca en el mapa la última ubicación donde viste a tu mascota.');
        return;
    }
    setIsLoading(true);
    setMessage('Activando modo rescate...');
    const payload = {
        isActive: true,
        lastSeen: { latitude: selectedCoordinates.lat, longitude: selectedCoordinates.lng, address: formData.address },
        message: formData.message,
        showContactPhone: formData.showContactPhone,
    };

    try {
        const user = auth.currentUser;
        if (!user) throw new Error("No autenticado.");
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/pets/${pet.id}/rescue-mode`, {
          method: 'POST', // <--- CORRECCIÓN
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
          body: JSON.stringify(payload)
      });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setMessage('¡Modo rescate activado! El aviso ya es visible para la comunidad.');
        onSuccess();
        setTimeout(() => onClose(), 2000);
    } catch (error) {
        setMessage(`Error: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>Reportar a {pet.name} como extraviado</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.warningBox}>
                <AlertTriangle size={32} /><p>Estás a punto de activar el <strong>Modo Rescate</strong>. El perfil de tu mascota será visible públicamente para ayudar en su búsqueda.</p>
            </div>
          
            <div className={sharedStyles.formGroup}>
                <label>Última ubicación conocida</label>
                <p className={styles.formDescription}>Haz clic en el mapa para marcar el punto exacto donde viste a {pet.name} por última vez.</p>
                <div className={styles.miniMapWrapper}>
                    <MapContainer center={initialMapPosition} zoom={13}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <LocationPicker onLocationSelect={handleLocationSelect} initialPos={selectedCoordinates} />
                    </MapContainer>
                </div>
                 {!selectedCoordinates && <small className={styles.mapPrompt}>Selecciona un punto en el mapa.</small>}
                 {selectedCoordinates && <small className={styles.mapPromptSuccess}>¡Ubicación seleccionada!</small>}
            </div>

            <div className={sharedStyles.formGroup}>
                <label htmlFor="address">Dirección o punto de referencia</label>
                <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Cerca del Parque Simón Bolívar" />
            </div>

            <div className={sharedStyles.formGroup}>
                <label htmlFor="message">Mensaje para la comunidad</label>
                <textarea id="message" name="message" rows="4" value={formData.message} onChange={handleChange} required></textarea>
            </div>

            <div className={sharedStyles.formGroup}>
                <div className={styles.checkboxWrapper}>
                    <input type="checkbox" id="showContactPhone" name="showContactPhone" checked={formData.showContactPhone} onChange={handleChange} />
                    <label htmlFor="showContactPhone">Autorizo mostrar mi número de teléfono en el aviso de búsqueda.</label>
                </div>
            </div>
            
            <div className={sharedStyles.modalFooter}>
                {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
                <button type="submit" className={`${sharedStyles.button} ${sharedStyles.danger}`} style={{width: '100%', backgroundColor: 'var(--error-red)'}} disabled={isLoading}>
                    {isLoading ? 'Activando...' : `Activar Modo Rescate`}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default RescueModeModal;