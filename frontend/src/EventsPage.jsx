import React, { useState, useEffect } from 'react';
import api from './services/api';
import LoadingComponent from './LoadingComponent';

// Un componente simple para mostrar cada evento
const EventCard = ({ event }) => (
  <div className="event-card-item">
    <h3>{event.title}</h3>
    <p>{new Date(event.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>{event.location}</p>
    <p>{event.description}</p>
    <div className="event-card-footer">
      <span>{event.attendeesCount || 0} asistentes</span>
      <button className="attend-button">Asistir</button>
    </div>
  </div>
);

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Llamamos al endpoint correcto que sí existe en nuestro backend
        const response = await api.get('/events');
        setEvents(response.data);
      } catch (err) {
        console.error("Error al obtener los eventos:", err);
        setError("No se pudieron cargar los eventos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="events-page">
      <div className="page-header">
        <h2>Eventos de la Comunidad</h2>
        <button className="create-event-button">+ Crear Evento</button>
      </div>
      
      {/* Aquí podrías añadir las pestañas de "Próximos", "Finalizados", etc. */}
      
      <div className="events-list">
        {events.length > 0 ? (
          events.map(event => <EventCard key={event.id} event={event} />)
        ) : (
          <p>No hay eventos programados por el momento.</p>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
