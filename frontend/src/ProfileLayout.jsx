// frontend/src/ProfileLayout.jsx
// Versión: 3.0 - Refactor de Navegación e Integración de Notificaciones
// CAMBIOS MAYORES:
// - Se elimina por completo la cabecera y la barra de pestañas superior.
// - Se integra el nuevo componente BottomNavBar para una navegación fija inferior.
// - Se añade la lógica para obtener el conteo de notificaciones no leídas y pasarlo a la barra.
// - Se gestiona la apertura del modal de creación de posts desde la barra.

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import './App.css';

// Importación de Páginas
import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx';
import MapPage from './MapPage.jsx';
import EventsPage from './EventsPage.jsx';
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import UserProfilePage from './UserProfilePage.jsx';
import NotificationsPage from './NotificationsPage.jsx'; // Nuevo

// Importación de Componentes
import LoadingComponent from './LoadingComponent.jsx';
import BottomNavBar from './BottomNavBar.jsx'; // Nuevo
import CreatePostModal from './CreatePostModal.jsx'; // Nuevo

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCoreData = useCallback(async () => {
    if (!user) return;
    if (!userProfile) setLoading(true); 
    try {
      const idToken = await user.getIdToken();
      const [profileResponse, petsResponse] = await Promise.all([
        fetch(`${API_URL}/api/profile`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`${API_URL}/api/pets`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
      ]);
      if (!profileResponse.ok || !petsResponse.ok) throw new Error("No se pudieron cargar los datos del perfil.");
      
      const profileData = await profileResponse.json();
      const petsData = await petsResponse.json();
      setUserProfile(profileData);
      setPets(petsData);
    } catch (error) {
      console.error("Error fetching core data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, { headers: { 'Authorization': `Bearer ${idToken}` } });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchCoreData();
    fetchUnreadCount();
    // Refrescar el contador cada 1 minuto
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCoreData, fetchUnreadCount]);

  const handleMarkAsRead = async () => {
    setUnreadCount(0); // Actualización optimista de la UI
    try {
      const idToken = await user.getIdToken();
      await fetch(`${API_URL}/api/notifications/mark-as-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      fetchUnreadCount(); // Si falla, volvemos a obtener el conteo real
    }
  };

  const handlePostCreated = (newPost) => {
    setIsCreateModalOpen(false);
    if (newPost) {
      // Redirigir al feed para ver la nueva publicación
      navigate('/dashboard');
      // Podríamos incluso insertar el post en el estado del feed si fuera necesario
    }
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    <div className="profile-container">
      {isCreateModalOpen && (
        <CreatePostModal 
          userProfile={userProfile}
          pets={pets}
          onClose={() => setIsCreateModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      <main className="tab-content">
        <Routes>
          <Route index element={<FeedPage userProfile={userProfile} pets={pets} />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage user={user} />} />
          <Route path="notifications" element={<NotificationsPage onMarkAsRead={handleMarkAsRead} />} />
          
          {/* Rutas que antes estaban en el menú superior, ahora se acceden desde otros lugares */}
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchCoreData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchCoreData} />} />
          
          <Route path="pet/:petId" element={<PetSocialProfile user={user} userProfile={userProfile} pets={pets} onUpdate={fetchCoreData} />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
        </Routes>
      </main>

      <BottomNavBar 
        unreadCount={unreadCount}
        onOpenCreatePost={() => setIsCreateModalOpen(true)}
      />
    </div>
  );
}

export default ProfileLayout;
