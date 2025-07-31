// frontend/src/CreateEventModal.jsx
// Versión: 1.7 - Corrección de Estilos de Botón
// TAREA: Se aplican las clases correctas del sistema de botones compartidos.

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from './firebase';
import { X, UploadCloud } from 'lucide-react';

import styles from './CreateEventModal.module.css';
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
  return position ? <Marker position={position}></Marker> : null;
}

const toLocalISOString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function CreateEventModal({ onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', 
    startDate: toLocalISOString(new Date()), 
    endDate: toLocalISOString(new Date(Date.now() + 3600 * 1000)),
    customAddress: '', contactPhone: '', contactEmail: ''
  });
  const [coverImage, setCoverImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [eventCategories, setEventCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mapInstance, setMapInstance] = useState(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/event-categories`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            });
            if (!response.ok) throw new Error('Error al cargar categorías');
            const data = await response.json();
            setEventCategories(data);
        } catch (error) {
            setMessage('No se pudieron cargar las categorías de eventos.');
        }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverImage) {
        setMessage('Por favor, sube una imagen de portada para el evento.');
        return;
    }
    if (!coordinates) {
      setMessage('Por favor, selecciona una ubicación para el evento en el mapa.');
      return;
    }
    setIsLoading(true);
    setMessage('Creando evento...');

    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('description', formData.description);
    formPayload.append('category', formData.category);
    
    formPayload.append('startDate', new Date(formData.startDate).toISOString());
    formPayload.append('endDate', new Date(formData.endDate).toISOString());

    formPayload.append('customAddress', formData.customAddress);
    formPayload.append('customLat', coordinates.latitude);
    formPayload.append('customLng', coordinates.longitude);
    formPayload.append('contactPhone', formData.contactPhone);
    formPayload.append('contactEmail', formData.contactEmail);
    formPayload.append('coverImage', coverImage);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const idToken = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formPayload
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage('¡Evento creado con éxito!');
      onEventCreated();
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
          <h2>Crear un Nuevo Evento</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={sharedStyles.formGroup}>
            <label>Imagen de Portada</label>
            <div className={styles.imageUploadArea} onClick={() => fileInputRef.current.click()}>
              {previewImage ? <img src={previewImage} alt="Previsualización" className={styles.imagePreview} /> : 
                <div className={styles.uploadPromptContent}><UploadCloud size={48} /><p>Selecciona una imagen</p></div>
              }
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" required />
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="name">Nombre del Evento</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="category">Categoría del Evento</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required >
              <option value="" disabled>Selecciona una categoría...</option>
              {eventCategories.map(cat => <option key={cat.id} value={cat.key}>{cat.name}</option>)}
            </select>
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows="4" value={formData.description} onChange={handleChange} required></textarea>
          </div>
          <div className={styles.formRow}>
            <div className={sharedStyles.formGroup}>
              <label htmlFor="startDate">Fecha y Hora de Inicio</label>
              <input type="datetime-local" id="startDate" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className={sharedStyles.formGroup}>
              <label htmlFor="endDate">Fecha y Hora de Fin</label>
              <input type="datetime-local" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </div>
          </div>
          <div className={sharedStyles.formGroup}>
            <label>Ubicación del Evento</label>
            <div className={styles.miniMapWrapper}>
              <MapContainer center={initialPosition} zoom={13} whenCreated={setMapInstance}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker onLocationSelect={(latlng) => setCoordinates({ latitude: latlng.lat, longitude: latlng.lng })} />
              </MapContainer>
            </div>
            {!coordinates && <small className={styles.mapPrompt}>Haz clic en el mapa para marcar el punto exacto.</small>}
            {coordinates && <small className={styles.mapPromptSuccess}>¡Ubicación seleccionada!</small>}
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="customAddress">Dirección (Opcional)</label>
            <input type="text" id="customAddress" name="customAddress" value={formData.customAddress} onChange={handleChange} />
          </div>
          <div className={sharedStyles.modalFooter}>
            {message && <p className={message.startsWith('Error') ? sharedStyles.responseMessageError : sharedStyles.responseMessage}>{message}</p>}
            {/* --- LÍNEA CORREGIDA --- */}
            <button 
              type="submit" 
              className={`${sharedStyles.button} ${sharedStyles.primary}`} 
              style={{width: '100%'}} 
              disabled={isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEventModal;