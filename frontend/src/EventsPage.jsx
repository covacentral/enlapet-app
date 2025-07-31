// frontend/src/EventsPage.jsx
// Versión: 1.5 - Refactorización a CSS Modules
// TAREA: Se implementan los módulos de estilos local y compartido para restaurar la apariencia.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import { Plus } from 'lucide-react';

// 1. IMPORTAMOS los nuevos módulos de CSS
import styles from './EventsPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EventsPage({ user }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'finished', 'cancelled'
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = useCallback(async (view = '') => {
    setIsLoading(true);
    setError(null);
    setEvents([]); 
    try {
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      const url = view ? `${API_URL}/api/events?view=${view}` : `${API_URL}/api/events`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error(`No se pudieron cargar los eventos (${view || 'actuales'}).`);
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    switch(activeTab) {
      case 'finished':
        fetchEvents('finished');
        break;
      case 'cancelled':
        fetchEvents('cancelled');
        break;
      default:
        fetchEvents(); 
    }
  }, [activeTab, fetchEvents]);

  const handleUpdate = () => {
    switch(activeTab) {
      case 'finished': fetchEvents('finished'); break;
      case 'cancelled': fetchEvents('cancelled'); break;
      default: fetchEvents();
    }
  }

  const renderContent = () => {
    if (isLoading) return <LoadingComponent text="Cargando eventos..." />;
    if (error) return <p className={sharedStyles.responseMessageError}>{error}</p>;

    if (activeTab === 'current') {
      const activeEvents = events.filter(e => e.status === 'active');
      const plannedEvents = events.filter(e => e.status === 'planned');
      return (
        <>
          <section className={styles.section}>
            <h3>Activos Ahora</h3>
            {activeEvents.length > 0 ? (
              <div className={styles.grid}>
                {activeEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}
              </div>
            ) : <p className={styles.emptyMessageSmall}>No hay eventos activos en este momento.</p>}
          </section>
          <section className={styles.section}>
            <h3>Próximamente</h3>
            {plannedEvents.length > 0 ? (
              <div className={styles.grid}>
                {plannedEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}
              </div>
            ) : <p className={styles.emptyMessageSmall}>No hay eventos planeados. ¡Anímate a crear uno!</p>}
          </section>
        </>
      );
    }

    return (
       <section className={styles.section}>
          <h3>Eventos {activeTab === 'finished' ? 'Pasados' : 'Cancelados'}</h3>
          {events.length > 0 ? (
            <div className={styles.grid}>
              {events.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}
            </div>
          ) : <p className={styles.emptyMessageSmall}>No hay eventos {activeTab === 'finished' ? 'finalizados' : 'cancelados'} para mostrar.</p>}
        </section>
    );
  };

  return (
    <>
      {isCreateModalOpen && <CreateEventModal onClose={() => setIsCreateModalOpen(false)} onEventCreated={handleUpdate} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} user={user} onClose={() => setSelectedEvent(null)} onUpdate={handleUpdate} />}
      
      {/* 2. APLICAMOS las clases de los módulos de CSS */}
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={sharedStyles.tabTitle} style={{marginBottom: 0}}>Eventos de la Comunidad</h2>
          <button className={`${sharedStyles.button} ${sharedStyles.buttonPrimary}`} onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} /> Crear Evento
          </button>
        </div>
        
        <div className={sharedStyles.modalTabs} style={{ marginBottom: '2rem' }}>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'current' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('current')}>Próximos y Activos</button>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'finished' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('finished')}>Finalizados</button>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'cancelled' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('cancelled')}>Cancelados</button>
        </div>

        {renderContent()}
      </div>
    </>
  );
}

export default EventsPage;