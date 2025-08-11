// frontend/src/EventsPage.jsx
// Versión 1.6: Unifica las pestañas de eventos finalizados y cancelados.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import { Plus } from 'lucide-react';

import styles from './EventsPage.module.css';
import sharedStyles from './shared.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EventsPage({ user }) {
  // 1. Simplificamos los estados a dos: 'current' e 'history'
  const [activeTab, setActiveTab] = useState('current');
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
      // El endpoint del backend ya soporta 'finished' y 'cancelled', solo necesitamos llamarlo correctamente.
      const url = view ? `${API_URL}/api/events?view=${view}` : `${API_URL}/api/events`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error(`No se pudieron cargar los eventos.`);
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // 2. Adaptamos la lógica para que 'history' llame a los dos tipos
    if (activeTab === 'history') {
      // Hacemos dos llamadas en paralelo para obtener ambos listados
      Promise.all([
        fetch(`${API_URL}/api/events?view=finished`, { headers: { 'Authorization': `Bearer ${user.accessToken}` } }).then(res => res.json()),
        fetch(`${API_URL}/api/events?view=cancelled`, { headers: { 'Authorization': `Bearer ${user.accessToken}` } }).then(res => res.json())
      ]).then(([finished, cancelled]) => {
        // Combinamos y ordenamos los resultados por fecha de creación
        const combined = [...finished, ...cancelled].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(combined);
        setIsLoading(false);
      }).catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
    } else {
      fetchEvents(); 
    }
  }, [activeTab, user]);

  const handleUpdate = () => {
    if (activeTab === 'history') {
        // Lógica para recargar el historial si fuera necesario
    } else {
        fetchEvents();
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
          <section className={styles.section}><h3>Activos Ahora</h3>{activeEvents.length > 0 ? <div className={styles.grid}>{activeEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}</div> : <p className={styles.emptyMessageSmall}>No hay eventos activos.</p>}</section>
          <section className={styles.section}><h3>Próximamente</h3>{plannedEvents.length > 0 ? <div className={styles.grid}>{plannedEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}</div> : <p className={styles.emptyMessageSmall}>No hay eventos planeados.</p>}</section>
        </>
      );
    }

    // Renderizado para la nueva pestaña "Historial"
    return (
       <section className={styles.section}>
          <h3>Historial de Eventos</h3>
          {events.length > 0 ? <div className={styles.grid}>{events.map(event => <EventCard key={event.id} event={event} onDetailsClick={setSelectedEvent} />)}</div> : <p className={styles.emptyMessageSmall}>No hay eventos en el historial.</p>}
        </section>
    );
  };

  return (
    <>
      {isCreateModalOpen && <CreateEventModal onClose={() => setIsCreateModalOpen(false)} onEventCreated={handleUpdate} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} user={user} onClose={() => setSelectedEvent(null)} onUpdate={handleUpdate} />}
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={sharedStyles.tabTitle} style={{marginBottom: 0}}>Eventos de la Comunidad</h2>
          <button className={`${sharedStyles.button} ${sharedStyles.primary}`} onClick={() => setIsCreateModalOpen(true)}><Plus size={18} /> Crear Evento</button>
        </div>
        
        {/* --- 3. [NUEVO] Layout de pestañas simplificado --- */}
        <div className={sharedStyles.modalTabs} style={{ marginBottom: '2rem' }}>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'current' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('current')}>Próximos y Activos</button>
            <button type="button" className={`${sharedStyles.modalTabButton} ${activeTab === 'history' ? sharedStyles.active : ''}`} onClick={() => setActiveTab('history')}>Historial</button>
        </div>

        {renderContent()}
      </div>
    </>
  );
}

export default EventsPage;