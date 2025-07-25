// frontend/src/EventsPage.jsx
// Versión: 1.1 - Conectar Modal de Creación (Completo)
// Importa y renderiza el modal para crear eventos.

import React, { useState, useEffect, useCallback } from 'react';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
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
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const activeEvents = events.filter(e => e.status === 'active');
  const plannedEvents = events.filter(e => e.status === 'planned');

  if (isLoading) {
    return <LoadingComponent text="Cargando eventos de la comunidad..." />;
  }

  return (
    <>
      {isModalOpen && <CreateEventModal onClose={() => setIsModalOpen(false)} onEventCreated={fetchEvents} />}
      
      <div className="events-page-container">
        <div className="events-header">
          <h2 className="tab-title">Eventos de la Comunidad</h2>
          <button className="create-event-button" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Crear Evento
          </button>
        </div>

        {error && <p className="response-message error">{error}</p>}

        <section className="events-section">
          <h3>Activos Ahora</h3>
          {activeEvents.length > 0 ? (
            <div className="events-grid">
              {activeEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <p className="empty-state-message small">No hay eventos activos en este momento.</p>
          )}
        </section>

        <section className="events-section">
          <h3>Próximamente</h3>
          {plannedEvents.length > 0 ? (
            <div className="events-grid">
              {plannedEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <p className="empty-state-message small">No hay eventos planeados. ¡Anímate a crear uno!</p>
          )}
        </section>
      </div>
    </>
  );
}

export default EventsPage;
