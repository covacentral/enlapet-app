// frontend/src/EventDetailModal.jsx
// Versión: 1.3 - Lógica de Finalización de Evento Mejorada
// CORRIGE: El botón "Marcar como Finalizado" ahora funciona correctamente.
// NUEVO:
// 1. El botón "Marcar como Finalizado" solo aparece para eventos en estado 'active'.
// 2. Se implementa un temporizador de 60 minutos desde el inicio del evento
//    antes de que el botón "Marcar como Finalizado" se active.
// 3. Se muestra una cuenta regresiva en el botón mientras está deshabilitado.
// ELIMINADO: Se quita el botón "Marcar como Activo" ya que el estado se calcula automáticamente.

import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { X, MapPin, Calendar, Clock, Edit, AlertCircle, MoreVertical, UploadCloud, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import ReportModal from './ReportModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973];

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
  const [editTimeLeft, setEditTimeLeft] = useState('');
  const [finishTimeLeft, setFinishTimeLeft] = useState(''); // [NUEVO] Estado para el contador de finalización
  const [canFinish, setCanFinish] = useState(false); // [NUEVO] Estado para habilitar el botón de finalizar
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [eventCategories, setEventCategories] = useState([]);

  const [editImage, setEditImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [editCoordinates, setEditCoordinates] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  
  const isOrganizer = event.organizerId === user.uid;
  const oneHourInMs = 60 * 60 * 1000;
  const createdAtTime = new Date(event.createdAt).getTime();
  const isEditable = (Date.now() - createdAtTime) < oneHourInMs;
  const eventStartTime = new Date(event.startDate).getTime();
  const finishAvailableTime = eventStartTime + oneHourInMs;


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
    const fetchCategories = async () => {
        try {
            const idToken = await user.getIdToken();
            const response = await fetch(`${API_URL}/api/event-categories`, { headers: { 'Authorization': `Bearer ${idToken}` } });
            if (response.ok) setEventCategories(await response.json());
        } catch (error) { console.error("Failed to fetch event categories:", error); }
    };
    fetchCategories();
  }, [event, user]);

  useEffect(() => {
    // [NUEVO] Lógica de temporizadores combinada
    const interval = setInterval(() => {
      const now = Date.now();
      // Temporizador para edición
      if (isOrganizer && isEditable) {
        const remainingEditMs = oneHourInMs - (now - createdAtTime);
        if (remainingEditMs > 0) {
          const minutes = Math.floor(remainingEditMs / 60000);
          const seconds = Math.floor((remainingEditMs % 60000) / 1000);
          setEditTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setEditTimeLeft('Tiempo expirado');
        }
      }
      // Temporizador para finalización
      if (isOrganizer && event.status === 'active') {
        if (now >= finishAvailableTime) {
          setCanFinish(true);
          setFinishTimeLeft('');
        } else {
          setCanFinish(false);
          const remainingFinishMs = finishAvailableTime - now;
          const minutes = Math.floor(remainingFinishMs / 60000);
          const seconds = Math.floor((remainingFinishMs % 60000) / 1000);
          setFinishTimeLeft(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    function handleClickOutside(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false); }
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOrganizer, isEditable, createdAtTime, event.status, finishAvailableTime]);

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
                  {isOrganizer && event.status !== 'cancelled' && event.status !== 'finished' && <button onClick={() => handleStatusChange('cancelled')} style={{color: 'var(--error-red)'}}>Cancelar Evento</button>}
                </div>
              )}
            </div>
            <button onClick={onClose} className="close-button" disabled={isLoading}><X size={24} /></button>
          </div>
        </div>
        
        {isEditMode ? (
          <form onSubmit={handleDetailsUpdate} className="add-location-form">
            <div className="form-group"><label>Imagen de Portada</label><div className="image-upload-area" onClick={() => fileInputRef.current.click()}><img src={previewImage} alt="Previsualización" className="image-preview" /></div><input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" /></div>
            <div className="form-group"><label>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} required/></div>
            <div className="form-group"><label>Categoría</label><select name="category" value={formData.category} onChange={handleChange} required>{eventCategories.map(cat => <option key={cat.id} value={cat.key}>{cat.name}</option>)}</select></div>
            <div className="form-group"><label>Descripción</label><textarea name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea></div>
            <div className="form-row"><div className="form-group"><label>Inicio</label><input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required/></div><div className="form-group"><label>Fin</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required/></div></div>
            <div className="form-group"><label>Ubicación</label><div className="mini-map-wrapper"><MapContainer center={editCoordinates || initialPosition} zoom={13} className="leaflet-container mini-map"><ChangeView center={editCoordinates || initialPosition} zoom={13} /><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" /><LocationPicker onLocationSelect={(latlng) => setEditCoordinates(latlng)} initialPos={editCoordinates} /></MapContainer></div></div>
            <div className="form-group"><label>Dirección</label><input type="text" name="customAddress" value={formData.customAddress} onChange={handleChange} /></div>
            <div className="modal-footer">{message && <p className="response-message">{message}</p>}<button type="submit" className="publish-button" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button></div>
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
                {isEditable && <div className="edit-notice" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--primary-accent)', marginBottom: '1rem' }}><AlertCircle size={16} /><span>Puedes editar los detalles. Tiempo restante: <strong>{editTimeLeft}</strong></span></div>}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {/* [CORRECCIÓN Y NUEVA LÓGICA] Botón de finalizar */}
                  {event.status === 'active' && (
                    <button 
                      onClick={() => handleStatusChange('finished')} 
                      disabled={isLoading || !canFinish} 
                      className="modal-button cancel"
                      title={canFinish ? 'Marcar el evento como finalizado' : 'Debes esperar 60 minutos desde el inicio del evento para poder finalizarlo.'}
                    >
                      <CheckCircle size={16}/> 
                      {canFinish ? 'Marcar como Finalizado' : `Finalizar en ${finishTimeLeft}`}
                    </button>
                  )}
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
