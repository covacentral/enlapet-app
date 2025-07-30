// frontend/src/EventCard.jsx
// Versión: 1.4 - Refactorización a CSS Modules
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, MoreVertical } from 'lucide-react';
import ReportModal from './ReportModal';
import styles from './EventCard.module.css';

function EventCard({ event, onDetailsClick }) {
  // ... (lógica existente sin cambios)
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
    }
    return `Del ${startDateString} al ${endDateString}`;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'planned': return { text: 'Planeado', className: styles.statusPlanned };
      case 'active': return { text: 'Activo Ahora', className: styles.statusActive };
      case 'finished': return { text: 'Finalizado', className: styles.statusFinished };
      case 'cancelled': return { text: 'Cancelado', className: styles.statusCancelled };
      default: return { text: 'Desconocido', className: styles.statusPlanned };
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
      <div className={styles.eventCard}>
        <div className={styles.imageWrapper}>
          <img src={event.coverImage} alt={event.name} className={styles.image} />
          <span className={`${styles.statusBadge} ${statusInfo.className}`}>{statusInfo.text}</span>
        </div>
        <div className={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className={styles.title}>{event.name}</h3>
            {/* El menú de opciones reutiliza clases globales, lo cual es aceptable */}
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
          <p className={styles.organizer}>Organizado por: <strong>{event.organizerName}</strong></p>
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <Calendar size={16} />
              <span>{formatEventDuration(event.startDate, event.endDate)}</span>
            </div>
            {event.customLocation?.address && (
              <div className={styles.detailItem}>
                  <MapPin size={16} />
                  <span>{event.customLocation.address}</span>
              </div>
            )}
          </div>
          <button className={styles.button} onClick={() => onDetailsClick(event)}>Ver Detalles</button>
        </div>
      </div>
    </>
  );
}

export default EventCard;