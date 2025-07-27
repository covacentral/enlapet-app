// frontend/src/EventCard.jsx
// Versión: 1.3 - Menú de Opciones y Reporte
// NUEVO: Se añade el botón "..." con la opción para reportar un evento.

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, MapPin, MoreVertical } from 'lucide-react';
import ReportModal from './ReportModal'; // Asumimos que ReportModal es genérico

function EventCard({ event, onDetailsClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);
  
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
      case 'cancelled': return { text: 'Cancelado', className: 'status-cancelled' };
      default: return { text: 'Desconocido', className: 'status-planned' };
    }
  };

  const statusInfo = getStatusInfo(event.status);

  return (
    <>
      {isReportModalOpen && (
        <ReportModal 
          contentId={event.id}
          contentType="evento"
          contentCreatorName={event.organizerName}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
      <div className="event-card">
        <div className="event-card-image-wrapper">
          <img src={event.coverImage} alt={event.name} className="event-card-image" />
          <span className={`event-status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
        </div>
        <div className="event-card-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className="event-card-title">{event.name}</h3>
            <div className="post-menu-container" ref={menuRef}>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="action-button">
                <MoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="post-menu-dropdown">
                  <button onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}>Reportar evento</button>
                </div>
              )}
            </div>
          </div>
          <p className="event-card-organizer">Organizado por: <strong>{event.organizerName}</strong></p>
          <div className="event-card-details">
            <div className="detail-item">
              <Calendar size={16} />
              <span>{formatEventDuration(event.startDate, event.endDate)}</span>
            </div>
            {event.customLocation?.address && (
              <div className="detail-item">
                  <MapPin size={16} />
                  <span>{event.customLocation.address}</span>
              </div>
            )}
          </div>
          <button className="event-card-button" onClick={() => onDetailsClick(event)}>Ver Detalles</button>
        </div>
      </div>
    </>
  );
}

export default EventCard;
