// frontend/src/EventDetailModal.jsx
// Versión: 1.1 - Lógica de Edición Corregida y UI Mejorada
// CORRECCIÓN: Se confía en el backend para la validación de la ventana de edición.
// MEJORA: Se añade un mensaje claro en la UI sobre el tiempo de edición.

import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { X, MapPin, Calendar, Clock, Edit, Save, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EventDetailModal({ event, user, onClose, onUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        startDate: event.startDate.substring(0, 16),
        endDate: event.endDate.substring(0, 16),
      });
    }
  }, [event]);

  const isOrganizer = event.organizerId === user.uid;
  const oneHourInMs = 60 * 60 * 1000;
  const createdAtTime = new Date(event.createdAt).getTime();
  const timeSinceCreation = Date.now() - createdAtTime;
  const isEditable = timeSinceCreation < oneHourInMs;

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
  }, [isOrganizer, isEditable, createdAtTime]);

  if (!event || !user) return null;

  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    setMessage(`Cambiando estado a ${newStatus}...`);
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
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/events/${event.id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage('¡Detalles actualizados!');
      onUpdate();
      setIsEditMode(false);
       setTimeout(() => {
        setMessage('');
      }, 2000);
    } catch (error) {
       setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="add-location-modal-content" onClick={e => e.stopPropagation()}>
        <img src={event.coverImage} alt={event.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
        <div className="modal-header" style={{ paddingTop: '1rem' }}>
          <h2>{event.name}</h2>
          <button onClick={onClose} className="close-button" disabled={isLoading}><X size={24} /></button>
        </div>
        <div className="modal-body" style={{ padding: '0 1.5rem 1.5rem' }}>
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

              {isEditMode ? (
                <form onSubmit={handleDetailsUpdate} className="pet-edit-form">
                  <div className="form-group">
                    <label>Nombre del Evento</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={isLoading} />
                  </div>
                   <div className="form-group">
                    <label>Descripción</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleChange} disabled={isLoading}></textarea>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="form-action-button save" disabled={isLoading}><Save size={16}/> Guardar Detalles</button>
                    <button type="button" onClick={() => setIsEditMode(false)} className="form-action-button cancel" disabled={isLoading}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => handleStatusChange('active')} disabled={isLoading || event.status === 'active'} className="modal-button">Marcar como Activo</button>
                  <button onClick={() => handleStatusChange('finished')} disabled={isLoading || event.status === 'finished'} className="modal-button cancel">Marcar como Finalizado</button>
                  <button onClick={() => setIsEditMode(true)} disabled={!isEditable || isLoading} className="modal-button" title={!isEditable ? 'El período de edición ha expirado' : 'Editar detalles'}>
                    <Edit size={16}/> Editar Detalles
                  </button>
                </div>
              )}
            </div>
          )}
          {message && <p className="response-message" style={{marginTop: '1rem'}}>{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default EventDetailModal;
