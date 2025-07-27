// frontend/src/EventDetailModal.jsx
// Versión: 1.2 - Edición Completa y Cancelación
// MEJORA: El modo edición ahora permite modificar todos los campos del evento.
// NUEVO: Se añade la funcionalidad para cancelar un evento.

import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { X, MapPin, Calendar, Clock, Edit, Save, AlertCircle, Trash2, MoreVertical, UploadCloud } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import ReportModal from './ReportModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973];

// --- Mini-componentes para el mapa de edición ---
function ChangeView({ center, zoom }) { const map = useMap(); map.setView(center, zoom); return null; }
function LocationPicker({ onLocationSelect, initialPos }) {
  const [position, setPosition] = useState(initialPos);
  useMapEvents({ click(e) { setPosition(e.latlng); onLocationSelect(e.latlng); } });
  return position ? <Marker position={position}></Marker> : null;
}

function EventDetailModal({ event, user, onClose, onUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [eventCategories, setEventCategories] = useState([]);

  const [editImage, setEditImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editCoordinates, setEditCoordinates] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        category: event.category,
        startDate: event.startDate.substring(0, 16),
        endDate: event.endDate.substring(0, 16),
        customAddress: event.customLocation?.address || '',
      });
      setPreviewImage(event.coverImage);
      if (event.customLocation?.coordinates) {
        setEditCoordinates({ 
          lat: event.customLocation.coordinates._latitude, 
          lng: event.customLocation.coordinates._longitude 
        });
      }
    }
    // Cargar categorías de eventos para el modo edición
    const fetchCategories = async () => {
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/event-categories`, { headers: { 'Authorization': `Bearer ${idToken}` } });
            if (response.ok) setEventCategories(await response.json());
        } catch (error) { console.error("Failed to fetch event categories:", error); }
    };
    fetchCategories();
  }, [event, user]);

  const isOrganizer = event.organizerId === user.uid;
  const oneHourInMs = 60 * 60 * 1000;
  const createdAtTime = new Date(event.createdAt).getTime();
  const isEditable = (Date.now() - createdAtTime) < oneHourInMs;

  useEffect(() => {
    if (isOrganizer && isEditable) {
      const interval = setInterval(() => {
        const remainingMs = oneHourInMs - (Date.now() - createdAtTime);
        if (remainingMs > 0) {
          const minutes = Math.floor(remainingMs / 60000);
          const seconds = Math.floor((remainingMs % 60000) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft('Tiempo expirado');
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    function handleClickOutside(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOrganizer, isEditable, createdAtTime]);

  if (!event || !user || !formData) return null;

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('¿Estás seguro de que quieres cancelar este evento? Esta acción no se puede deshacer.')) {
      return;
    }
    setIsLoading(true);
    setMessage(`Actualizando estado...`);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/events/${event.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('¡Estado actualizado!');
      onUpdate();
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDetailsUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('Guardando cambios...');
    
    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('description', formData.description);
    formPayload.append('category', formData.category);
    formPayload.append('startDate', formData.startDate);
    formPayload.append('endDate', formData.endDate);
    if (editCoordinates) {
      formPayload.append('customLat', editCoordinates.lat);
      formPayload.append('customLng', editCoordinates.lng);
    }
    formPayload.append('customAddress', formData.customAddress);
    if (editImage) {
      formPayload.append('coverImage', editImage);
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/events/${event.id}/details`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formPayload,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('¡Detalles actualizados!');
      onUpdate();
      setIsEditMode(false);
    } catch (error) {
       setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setEditImage(file); setPreviewImage(URL.createObjectURL(file)); }
  };

  return (
    <>
    {isReportModalOpen && <ReportModal contentId={event.id} contentType="evento" contentCreatorName={event.organizerName} onClose={() => setIsReportModalOpen(false)} />}
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-location-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Editando Evento' : event.name}</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className="post-menu-container" ref={menuRef}>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="action-button"><MoreVertical size={20} /></button>
              {isMenuOpen && (
                <div className="post-menu-dropdown">
                  <button onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}>Reportar evento</button>
                  {isOrganizer && <button onClick={() => handleStatusChange('cancelled')} style={{color: 'var(--error-red)'}}>Cancelar Evento</button>}
                </div>
              )}
            </div>
            <button onClick={onClose} className="close-button" disabled={isLoading}><X size={24} /></button>
          </div>
        </div>
        
        {isEditMode ? (
          <form onSubmit={handleDetailsUpdate} className="add-location-form">
            <div className="form-group">
              <label>Imagen de Portada</label>
              <div className="image-upload-area" onClick={() => fileInputRef.current.click()}>
                <img src={previewImage} alt="Previsualización" className="image-preview" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
            </div>
            <div className="form-group"><label>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} required/></div>
            <div className="form-group"><label>Categoría</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                    {eventCategories.map(cat => <option key={cat.id} value={cat.key}>{cat.name}</option>)}
                </select>
            </div>
            <div className="form-group"><label>Descripción</label><textarea name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea></div>
            <div className="form-row">
                <div className="form-group"><label>Inicio</label><input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required/></div>
                <div className="form-group"><label>Fin</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required/></div>
            </div>
            <div className="form-group"><label>Ubicación</label>
                <div className="mini-map-wrapper">
                    <MapContainer center={editCoordinates || initialPosition} zoom={13} className="leaflet-container mini-map">
                        <ChangeView center={editCoordinates || initialPosition} zoom={13} />
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <LocationPicker onLocationSelect={(latlng) => setEditCoordinates(latlng)} initialPos={editCoordinates} />
                    </MapContainer>
                </div>
            </div>
            <div className="form-group"><label>Dirección</label><input type="text" name="customAddress" value={formData.customAddress} onChange={handleChange} /></div>
            <div className="modal-footer">
                {message && <p className="response-message">{message}</p>}
                <button type="submit" className="publish-button" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button>
            </div>
          </form>
        ) : (
          <div className="modal-body" style={{ padding: '0 1.5rem 1.5rem' }}>
            <img src={event.coverImage} alt={event.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
            <p><strong>Organizado por:</strong> {event.organizerName}</p>
            <div className="event-card-details" style={{ marginBottom: '1rem' }}>
              <div className="detail-item"><Calendar size={16} /><span>{new Date(event.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div className="detail-item"><Clock size={16} /><span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              {event.customLocation?.address && <div className="detail-item"><MapPin size={16} /><span>{event.customLocation.address}</span></div>}
            </div>
            <p>{event.description}</p>
            {isOrganizer && (
              <div className="organizer-controls" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <h4>Gestionar Evento</h4>
                <div className="edit-notice" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: isEditable ? 'var(--primary-accent)' : 'orange', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  {isEditable ? <span>Puedes editar los detalles. Tiempo restante: <strong>{timeLeft}</strong></span> : <span>El período para editar detalles ha finalizado.</span>}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleStatusChange('active')} disabled={isLoading || event.status === 'active'} className="modal-button">Marcar como Activo</button>
                  <button onClick={() => handleStatusChange('finished')} disabled={isLoading || event.status === 'finished'} className="modal-button cancel">Marcar como Finalizado</button>
                  <button onClick={() => setIsEditMode(true)} disabled={!isEditable || isLoading} className="modal-button" title={!isEditable ? 'El período de edición ha expirado' : 'Editar detalles'}>
                    <Edit size={16}/> Editar Detalles
                  </button>
                </div>
              </div>
            )}
            {message && <p className="response-message" style={{marginTop: '1rem'}}>{message}</p>}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default EventDetailModal;
