// frontend/src/EventCard.jsx
// Versión: 1.2 - Visualización de Fecha de Finalización
// CORRECCIÓN: Ahora muestra la fecha de finalización si el evento dura más de un día.

import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

function EventCard({ event, onDetailsClick }) {
  
  const formatEventDuration = (startIso, endIso) => {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    const optionsDate = { year: 'numeric', month: 'long', day: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };

    const startDateString = startDate.toLocaleDateString('es-ES', optionsDate);
    const endDateString = endDate.toLocaleDateString('es-ES', optionsDate);

    const startTimeString = startDate.toLocaleTimeString('es-CO', optionsTime);
    const endTimeString = endDate.toLocaleTimeString('es-CO', optionsTime);

    if (startDateString === endDateString) {
      return `${startDateString}, ${startTimeString} - ${endTimeString}`;
    } else {
      return `Del ${startDateString} al ${endDateString}`;
    }
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
            {/* [CORRECCIÓN] Usamos la nueva función para mostrar la duración completa */}
            <span>{formatEventDuration(event.startDate, event.endDate)}</span>
          </div>
          {event.customLocation?.address && (
            <div className="detail-item">
                <MapPin size={16} />
                <span>{event.customLocation.address}</span>
            </div>
          )}
        </div>
        <button className="event-card-button" onClick={onDetailsClick}>Ver Detalles</button>
      </div>
    </div>
  );
}

export default EventCard;
