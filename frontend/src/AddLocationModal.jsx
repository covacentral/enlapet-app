// frontend/src/AddLocationModal.jsx
// Versión: 1.7 - Refactorización a CSS Modules y Corrección de Layout
// CAMBIO: Se importa y utiliza el módulo de estilos compartido FormModal.module.css.
// CORRIGE: El bug de desbordamiento de elementos del formulario.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from './firebase';
import { X } from 'lucide-react';
import styles from './FormModal.module.css'; // <-- 1. Importamos el módulo compartido

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
    <div className="modal-backdrop" onClick={onClose}>
      {/* --- 2. Se actualizan las clases para usar el objeto 'styles' --- */}
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Añadir un Nuevo Lugar</h2>
          <button onClick={onClose} className={styles.closeButton} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="name">Nombre del Lugar</label>
            <input type="text" id="name" name="name" onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select id="category" name="category" onChange={handleChange} required value={formData.category}>
              <option value="" disabled>Selecciona una categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.key}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Selecciona la ubicación en el mapa</label>
            <div className={styles.miniMapWrapper}>
              <MapContainer center={initialPosition} zoom={13} className="leaflet-container" whenCreated={setMapInstance}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </div>
            {!coordinates && <small className={styles.mapPrompt}>Haz clic en el mapa para marcar el punto exacto.</small>}
            {coordinates && <small className={`${styles.mapPrompt} ${styles.success}`}>¡Ubicación seleccionada!</small>}
          </div>
           <div className="form-group">
            <label htmlFor="description">Descripción (Opcional)</label>
            <textarea id="description" name="description" rows="3" onChange={handleChange}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="address">Dirección (Opcional)</label>
            <input type="text" id="address" name="address" onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Teléfono de Contacto (Opcional)</label>
            <input type="tel" id="phone" name="phone" onChange={handleChange} />
          </div>
          <div className={styles.modalFooter}>
            {message && <p className="response-message">{message}</p>}
            <button type="submit" className="publish-button" disabled={isLoading || !coordinates || !formData.category}>
              {isLoading ? 'Guardando...' : 'Añadir Lugar al Mapa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLocationModal;