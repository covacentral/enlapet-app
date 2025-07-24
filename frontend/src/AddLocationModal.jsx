// frontend/src/AddLocationModal.jsx
// Versión: 1.1 - Rediseñado a una Columna
// Mejora la UX con un diseño de una sola columna y una mejor estructura.

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from './firebase';
import { X } from 'lucide-react';

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
    name: '',
    category: '',
    address: '',
    description: '',
    phone: '',
    email: ''
  });
  const [coordinates, setCoordinates] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = (latlng) => {
    setCoordinates({ latitude: latlng.lat, longitude: latlng.lng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordinates) {
      setMessage('Por favor, selecciona una ubicación en el mapa.');
      return;
    }
    if (!formData.category) {
        setMessage('Por favor, selecciona una categoría.');
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
      <div className="add-location-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Añadir un Nuevo Lugar</h2>
          <button onClick={onClose} className="close-button" disabled={isLoading}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-location-form">
          {/* El formulario ahora es una sola columna */}
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
            <div className="mini-map-wrapper">
              <MapContainer center={initialPosition} zoom={6} className="leaflet-container mini-map">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </div>
            {!coordinates && <small className="map-prompt">Haz clic en el mapa para marcar el punto exacto.</small>}
            {coordinates && <small className="map-prompt success">¡Ubicación seleccionada!</small>}
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
          <div className="modal-footer">
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
