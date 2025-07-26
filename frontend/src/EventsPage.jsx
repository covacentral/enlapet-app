// frontend/src/EventsPage.jsx
// Versión: 1.3 - Pestaña de Eventos Finalizados
// NUEVO: Se añade una pestaña y la lógica para visualizar eventos que ya han terminado.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EventsPage({ user }) {
  const [activeTab, setActiveTab] = useState('current'); // 'current' o 'finished'
  const [events, setEvents] = useState([]);
  const [finishedEvents, setFinishedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchCurrentEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/events`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar los eventos.');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // [NUEVO] Función para cargar los eventos finalizados
  const fetchFinishedEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      // Usamos el nuevo parámetro 'view' en la API
      const response = await fetch(`${API_URL}/api/events?view=finished`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar los eventos finalizados.');
      const data = await response.json();
      setFinishedEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'current') {
      fetchCurrentEvents();
    } else {
      fetchFinishedEvents();
    }
  }, [activeTab, fetchCurrentEvents, fetchFinishedEvents]);

  const activeEvents = events.filter(e => e.status === 'active');
  const plannedEvents = events.filter(e => e.status === 'planned');

  const handleUpdate = () => {
    // Refresca la vista actual después de una acción en el modal
    if (activeTab === 'current') {
      fetchCurrentEvents();
    } else {
      fetchFinishedEvents();
    }
  }

  return (
    <>
      {isCreateModalOpen && <CreateEventModal onClose={() => setIsCreateModalOpen(false)} onEventCreated={fetchCurrentEvents} />}
      {selectedEvent && <EventDetailModal event={selectedEvent} user={user} onClose={() => setSelectedEvent(null)} onUpdate={handleUpdate} />}
      
      <div className="events-page-container">
        <div className="events-header">
          <h2 className="tab-title">Eventos de la Comunidad</h2>
          <button className="create-event-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} /> Crear Evento
          </button>
        </div>
        
        {/* [NUEVO] Pestañas para cambiar de vista */}
        <div className="modal-tabs" style={{ marginBottom: '2rem' }}>
            <button type="button" className={`modal-tab-button ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>
                Próximos y Activos
            </button>
            <button type="button" className={`modal-tab-button ${activeTab === 'finished' ? 'active' : ''}`} onClick={() => setActiveTab('finished')}>
                Finalizados
            </button>
        </div>

        {isLoading && <LoadingComponent text="Cargando eventos..." />}
        {error && <p className="response-message error">{error}</p>}

        {!isLoading && activeTab === 'current' && (
          <>
            <section className="events-section">
              <h3>Activos Ahora</h3>
              {activeEvents.length > 0 ? (
                <div className="events-grid">
                  {activeEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={() => setSelectedEvent(event)} />)}
                </div>
              ) : (
                <p className="empty-state-message small">No hay eventos activos en este momento.</p>
              )}
            </section>
            <section className="events-section">
              <h3>Próximamente</h3>
              {plannedEvents.length > 0 ? (
                <div className="events-grid">
                  {plannedEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={() => setSelectedEvent(event)} />)}
                </div>
              ) : (
                <p className="empty-state-message small">No hay eventos planeados. ¡Anímate a crear uno!</p>
              )}
            </section>
          </>
        )}

        {!isLoading && activeTab === 'finished' && (
           <section className="events-section">
              <h3>Eventos Pasados</h3>
              {finishedEvents.length > 0 ? (
                <div className="events-grid">
                  {finishedEvents.map(event => <EventCard key={event.id} event={event} onDetailsClick={() => setSelectedEvent(event)} />)}
                </div>
              ) : (
                <p className="empty-state-message small">No hay eventos finalizados para mostrar.</p>
              )}
            </section>
        )}
      </div>
    </>
  );
}

export default EventsPage;
