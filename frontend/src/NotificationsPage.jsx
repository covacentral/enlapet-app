// frontend/src/NotificationsPage.jsx
// Página para mostrar la lista de notificaciones del usuario.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function NotificationsPage({ onMarkAsRead }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!response.ok) throw new Error('No se pudieron cargar las notificaciones.');
      const data = await response.json();
      setNotifications(data);
      
      // Notificar al layout que las notificaciones se han visto
      onMarkAsRead();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onMarkAsRead]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationLinkAndText = (notification) => {
    const { type, actorName, entityId, entityType } = notification;
    let text = '';
    let link = '/dashboard';

    switch (type) {
      case 'new_follower':
        text = `${actorName} ha comenzado a seguirte.`;
        link = `/dashboard/user/${notification.actorId}`;
        break;
      case 'new_like':
        text = `A ${actorName} le gustó tu momento.`;
        link = `/dashboard`; // Idealmente, debería llevar al post específico
        break;
      case 'new_comment':
        text = `${actorName} comentó en tu momento.`;
        link = `/dashboard`; // Idealmente, debería llevar al post específico
        break;
      default:
        text = 'Tienes una nueva notificación.';
    }
    return { text, link };
  };

  if (isLoading) return <LoadingComponent text="Cargando tus notificaciones..." />;
  if (error) return <p className="response-message error">{error}</p>;

  return (
    <div className="notifications-page">
      <h2 className="tab-title">Notificaciones</h2>
      {notifications.length > 0 ? (
        <div className="notifications-list">
          {notifications.map(notif => {
            const { text, link } = getNotificationLinkAndText(notif);
            const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es });
            return (
              <Link to={link} key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                <img src={notif.actorProfilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} alt={notif.actorName} className="notification-actor-pic" />
                <div className="notification-content">
                  <p className="notification-text">{text}</p>
                  <p className="notification-time">{timeAgo}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="empty-state-message">No tienes notificaciones nuevas.</p>
      )}
    </div>
  );
}

export default NotificationsPage;
