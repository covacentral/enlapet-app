// frontend/src/AddLocationModal.jsx
// Versión: 1.8 - Corrección de Estilos de Botón
// TAREA: Se aplican las clases correctas del sistema de botones compartidos.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from './firebase';
import { X } from 'lucide-react';

import styles from './AddLocationModal.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973];

function LocationPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

function AddLocationModal({ categories, onClose, onLocationAdded }) {
  const [formData, setFormData] = useState({
    name: '', category: '', address: '', description: '', phone: '', email: ''
  });
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (!mapInstance) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        mapInstance.setView(coords, 13);
      },
      () => {
        console.log("No se pudo obtener la ubicación, se usará la inicial.");
      }
    );
  }, [mapInstance]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (latlng) => {
    setCoordinates({ latitude: latlng.lat, longitude: latlng.lng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) {
        setMessage('Por favor, selecciona una categoría.');
        return;
    }
    if (!coordinates) {
      setMessage('Por favor, selecciona una ubicación en el mapa.');
      return;
    }
    setIsLoading(true);
    setMessage('Añadiendo lugar...');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const idToken = await user.getIdToken();

      const payload = {
        name: formData.name,
        category: formData.category,
        address: formData.address,
        description: formData.description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        contact: {
          phone: formData.phone,
          email: formData.email
        }
      };

      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage('¡Lugar añadido con éxito!');
      onLocationAdded();
      setTimeout(() => onClose(), 1500);

    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>Añadir un Nuevo Lugar</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="name">Nombre del Lugar</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="category">Categoría</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
              <option value="" disabled>Selecciona una categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.key}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className={sharedStyles.formGroup}>
            <label>Selecciona la ubicación en el mapa</label>
            <div className={styles.miniMapWrapper}>
              <MapContainer center={initialPosition} zoom={13} whenCreated={setMapInstance}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </div>
            {!coordinates && <small className={styles.mapPrompt}>Haz clic en el mapa para marcar el punto exacto.</small>}
            {coordinates && <small className={styles.mapPromptSuccess}>¡Ubicación seleccionada!</small>}
          </div>
           <div className={sharedStyles.formGroup}>
            <label htmlFor="description">Descripción (Opcional)</label>
            <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="address">Dirección (Opcional)</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="phone">Teléfono de Contacto (Opcional)</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className={sharedStyles.modalFooter}>
            {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
            {/* --- LÍNEA CORREGIDA --- */}
            <button 
              type="submit" 
              className={`${sharedStyles.button} ${sharedStyles.primary}`} 
              style={{width: '100%'}} 
              disabled={isLoading || !coordinates || !formData.category}
            >
              {isLoading ? 'Guardando...' : 'Añadir Lugar al Mapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLocationModal;