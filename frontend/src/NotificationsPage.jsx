import React, { useState, useEffect } from 'react';
import api from './services/api';
import LoadingComponent from './LoadingComponent';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // Llamamos al endpoint correcto que sí existe en nuestro backend
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (err) {
        setError("No se pudieron cargar las notificaciones.");
        console.error("Error al obtener las notificaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []); // El array vacío asegura que la llamada se haga solo una vez

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h2>Notificaciones</h2>
      </div>
      
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${notif.read ? 'read' : 'unread'}`}>
              {/* El contenido real de la notificación dependerá de su estructura en la BD */}
              <p>{notif.message || `Tienes una nueva notificación del ${new Date(notif.createdAt).toLocaleDateString('es-CO')}.`}</p>
              <small>{new Date(notif.createdAt).toLocaleString('es-CO')}</small>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>No tienes notificaciones nuevas.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
