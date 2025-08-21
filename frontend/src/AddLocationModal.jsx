// frontend/src/AddLocationModal.jsx
// Versión 1.9: Se alinea la importación de 'colombiaData' con el estándar del proyecto, respetando la versión 1.8.

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { auth } from './firebase';
import { X } from 'lucide-react';
// --- [LÍNEA CORREGIDA] ---
// Se corrige la importación para usar la exportación nombrada explícita.
import { colombiaDepartments } from './utils/colombiaData';

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
  const [cities, setCities] = useState([]);
  const [department, setDepartment] = useState('');
  const [city, setCity] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setDepartment(newDepartment);
    setCity(''); // Resetea la ciudad al cambiar de departamento
    // --- [LÍNEA CORREGIDA] ---
    const departmentData = colombiaDepartments.find(d => d.department === newDepartment);
    setCities(departmentData ? departmentData.cities.map(c => c.name) : []);
  };

  const handleLocationSelect = (latlng) => {
    setCoordinates({ lat: latlng.lat, lng: latlng.lng });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coordinates || !formData.category || !formData.name) {
      setMessage("Por favor, completa el nombre, la categoría y selecciona un punto en el mapa.");
      return;
    }
    setIsLoading(true);
    setMessage('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();

      const payload = {
        ...formData,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        department,
        city
      };

      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al añadir la ubicación.');
      }

      setMessage("Ubicación añadida con éxito.");
      onLocationAdded(data);
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
          <h2>Añadir Nuevo Lugar</h2>
          <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.mapFormContainer}>
            <div className={styles.miniMapWrapper}>
              <MapContainer center={initialPosition} zoom={5}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </MapContainer>
            </div>
            {!coordinates && <small className={styles.mapPrompt}>Haz clic en el mapa para seleccionar la ubicación.</small>}
            {coordinates && <small className={styles.mapPromptSuccess}>¡Ubicación seleccionada!</small>}
          </div>

          <div className={sharedStyles.formGroup}>
            <label htmlFor="name">Nombre del Lugar</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className={sharedStyles.formGroup}>
            <label htmlFor="category">Categoría</label>
            <select id="category" name="category" value={formData.category} onChange={handleChange} required>
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formGroup}>
              <label htmlFor="department">Departamento</label>
              <select id="department" value={department} onChange={handleDepartmentChange}>
                <option value="">Selecciona un departamento</option>
                {/* --- [LÍNEA CORREGIDA] --- */}
                {colombiaDepartments.map(d => (
                  <option key={d.id} value={d.department}>{d.department}</option>
                ))}
              </select>
            </div>
            <div className={sharedStyles.formGroup}>
              <label htmlFor="city">Ciudad</label>
              <select id="city" value={city} onChange={e => setCity(e.target.value)} disabled={!department}>
                <option value="">Selecciona una ciudad</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
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