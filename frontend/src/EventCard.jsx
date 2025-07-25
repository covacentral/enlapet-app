// frontend/src/EventCard.jsx
// Versión: 1.0 - Tarjeta de Evento
// Muestra la información principal de un evento comunitario.

import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

function EventCard({ event }) {
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'planned': return { text: 'Planeado', className: 'status-planned' };
      case 'active': return { text: 'Activo Ahora', className: 'status-active' };
      case 'finished': return { text: 'Finalizado', className: 'status-finished' };
      default: return { text: 'Desconocido', className: 'status-planned' };
    }
  };

  const statusInfo = getStatusInfo(event.status);

  return (
    <div className="event-card">
      <div className="event-card-image-wrapper">
        <img src={event.coverImage} alt={event.name} className="event-card-image" />
        <span className={`event-status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
      </div>
      <div className="event-card-content">
        <h3 className="event-card-title">{event.name}</h3>
        <p className="event-card-organizer">Organizado por: <strong>{event.organizerName}</strong></p>
        <div className="event-card-details">
          <div className="detail-item">
            <Calendar size={16} />
            <span>{formatDate(event.startDate)}</span>
          </div>
          <div className="detail-item">
            <Clock size={16} />
            <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
          </div>
          {event.customLocation?.address && (
            <div className="detail-item">
                <MapPin size={16} />
                <span>{event.customLocation.address}</span>
            </div>
          )}
        </div>
        <button className="event-card-button">Ver Detalles</button>
      </div>
    </div>
  );
}

export default EventCard;
