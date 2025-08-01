// frontend/src/NotificationsPage.jsx
// Versión 2.1 - Refactorización a CSS Modules
// TAREA: Se implementan los módulos de estilos local y compartido.

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// 1. IMPORTAMOS los nuevos módulos de CSS
import styles from './NotificationsPage.module.css';
import sharedStyles from './shared.module.css';

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
    const { type, entityId, entityContext } = notification;
    let text = '';
    let link = '/dashboard';
    const targetName = entityContext?.authorName ? `el momento de ${entityContext.authorName}` : 'tu momento';

    switch (type) {
      case 'new_follower':
        text = `ha comenzado a seguirte.`;
        link = `/dashboard/user/${notification.actorId}`;
        break;
      case 'new_like':
        text = `le gustó ${targetName}.`;
        link = `/dashboard/notifications/post/${entityId}`;
        break;
      case 'new_comment':
        text = `comentó en ${targetName}.`;
        link = `/dashboard/notifications/post/${entityId}`;
        break;
      default:
        text = 'ha interactuado contigo.';
    }
    return { text, link };
  };

  if (isLoading) return <LoadingComponent text="Cargando tus notificaciones..." />;
  if (error) return <p className={sharedStyles.responseMessageError}>{error}</p>;

  return (
    // 2. APLICAMOS las clases de los módulos de CSS
    <div className={styles.page}>
      <h2 className={sharedStyles.tabTitle}>Notificaciones</h2>
      {notifications.length > 0 ? (
        <div className={styles.list}>
          {notifications.map(notif => {
            const { text, link } = getNotificationLinkAndText(notif);
            const timeAgo = formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es });
            return (
              <Link to={link} key={notif.id} className={`${styles.item} ${!notif.read ? styles.unread : ''}`}>
                <img src={notif.actorProfilePic || 'https://placehold.co/100x100/E2E8F0/4A5568?text=:)'} alt={notif.actorName} className={styles.actorPic} />
                <div className={styles.content}>
                  <p className={styles.text}>
                    <strong>{notif.actorName}</strong> {text}
                  </p>
                  {notif.entityContext?.preview && (
                    <p className={styles.preview}>
                      "{notif.entityContext.preview}..."
                    </p>
                  )}
                  <p className={styles.time}>{timeAgo}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className={sharedStyles.emptyStateMessage}>No tienes notificaciones nuevas.</p>
      )}
    </div>
  );
}

export default NotificationsPage;