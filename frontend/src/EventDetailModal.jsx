// frontend/src/EventDetailModal.jsx
// Versión: 1.5 - Corrección de Imagen Desbordada
// TAREA: Se aplica la clase .imagePreview para contener la imagen en modo edición.

import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { X, MapPin, Calendar, Clock, Edit, AlertCircle, MoreVertical, UploadCloud, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import ReportModal from './ReportModal';

import styles from './EventDetailModal.module.css';
import sharedStyles from './shared.module.css';

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
  const [finishTimeLeft, setFinishTimeLeft] = useState('');
  const [canFinish, setCanFinish] = useState(false);
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
    const interval = setInterval(() => {
      const now = Date.now();
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
    <div className={sharedStyles.modalBackdrop} onClick={onClose}>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h2>{isEditMode ? 'Editando Evento' : event.name}</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <div className={styles.menuContainer} ref={menuRef}>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={sharedStyles.closeButton}><MoreVertical size={20} /></button>
              {isMenuOpen && (
                <div className={styles.menuDropdown}>
                  <button className={styles.menuButton} onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}>Reportar evento</button>
                  {isOrganizer && event.status !== 'cancelled' && event.status !== 'finished' && <button className={styles.menuButton} onClick={() => handleStatusChange('cancelled')} style={{color: 'var(--error-red)'}}>Cancelar Evento</button>}
                </div>
              )}
            </div>
            <button onClick={onClose} className={sharedStyles.closeButton} disabled={isLoading}><X size={24} /></button>
          </div>
        </div>
        
        {isEditMode ? (
          <form onSubmit={handleDetailsUpdate} className={sharedStyles.form}>
            {/* --- LÍNEA CORREGIDA --- */}
            <div className={sharedStyles.formGroup}>
              <label>Imagen de Portada</label>
              <div className={styles.imageUploadArea} onClick={() => fileInputRef.current.click()}>
                <img src={previewImage} alt="Previsualización" className={styles.imagePreview} />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
            </div>
            <div className={sharedStyles.formGroup}><label>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} required/></div>
            <div className={sharedStyles.formGroup}><label>Categoría</label><select name="category" value={formData.category} onChange={handleChange} required>{eventCategories.map(cat => <option key={cat.id} value={cat.key}>{cat.name}</option>)}</select></div>
            <div className={sharedStyles.formGroup}><label>Descripción</label><textarea name="description" rows="3" value={formData.description} onChange={handleChange} required></textarea></div>
            <div className={sharedStyles.formRow}><div className={sharedStyles.formGroup}><label>Inicio</label><input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} required/></div><div className={sharedStyles.formGroup}><label>Fin</label><input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} required/></div></div>
            <div className={sharedStyles.formGroup}><label>Ubicación</label><div className={styles.miniMapWrapper}><MapContainer center={editCoordinates || initialPosition} zoom={13}><ChangeView center={editCoordinates || initialPosition} zoom={13} /><TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" /><LocationPicker onLocationSelect={(latlng) => setEditCoordinates(latlng)} initialPos={editCoordinates} /></MapContainer></div></div>
            <div className={sharedStyles.formGroup}><label>Dirección</label><input type="text" name="customAddress" value={formData.customAddress} onChange={handleChange} /></div>
            <div className={sharedStyles.modalFooter}>{message && <p className={sharedStyles.responseMessage}>{message}</p>}<button type="submit" className={`${sharedStyles.button} ${sharedStyles.primary}`} style={{width: '100%'}} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</button></div>
          </form>
        ) : (
          <div className={styles.body}>
            <img src={event.coverImage} alt={event.name} className={styles.coverImage} />
            <p><strong>Organizado por:</strong> {event.organizerName}</p>
            <div className={styles.details}>
              <div className={styles.detailItem}><Calendar size={16} /><span>{new Date(event.startDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              <div className={styles.detailItem}><Clock size={16} /><span>{new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
              {event.customLocation?.address && <div className={styles.detailItem}><MapPin size={16} /><span>{event.customLocation.address}</span></div>}
            </div>
            <p className={styles.description}>{event.description}</p>
            {isOrganizer && (
              <div className={styles.organizerControls}>
                <h4>Gestionar Evento</h4>
                {isEditable && <div className={styles.editNotice}><AlertCircle size={16} /><span>Puedes editar los detalles. Tiempo restante: <strong>{editTimeLeft}</strong></span></div>}
                <div className={styles.controlsContainer}>
                  {event.status === 'active' && (
                    <button 
                      onClick={() => handleStatusChange('finished')} 
                      disabled={isLoading || !canFinish} 
                      className={`${sharedStyles.button} ${sharedStyles.secondary}`}
                      title={canFinish ? 'Marcar el evento como finalizado' : 'Debes esperar 60 minutos desde el inicio del evento para poder finalizarlo.'}
                    >
                      <CheckCircle size={16}/> 
                      {canFinish ? 'Marcar como Finalizado' : `Finalizar en ${finishTimeLeft}`}
                    </button>
                  )}
                  <button onClick={() => setIsEditMode(true)} disabled={!isEditable || isLoading} className={`${sharedStyles.button} ${sharedStyles.secondary}`} title={!isEditable ? 'El período de edición ha expirado' : 'Editar detalles'}>
                    <Edit size={16}/> Editar Detalles
                  </button>
                </div>
              </div>
            )}
            {message && <p className={sharedStyles.responseMessage} style={{marginTop: '1rem'}}>{message}</p>}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default EventDetailModal;