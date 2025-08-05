// frontend/src/ProfileLayout.jsx
// Versión: 3.5 - CORRECCIÓN CRÍTICA de Bucle Infinito
// TAREA: Se corrige la dependencia en useCallback para evitar un ciclo infinito de fetching de datos.

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './firebase';

import styles from './ProfileLayout.module.css';

// Importación de Páginas
import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx';
import MapPage from './MapPage.jsx';
import EventsPage from './EventsPage.jsx';
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import UserProfilePage from './UserProfilePage.jsx';
import NotificationsPage from './NotificationsPage.jsx';

// Importación de Componentes
import LoadingComponent from './LoadingComponent.jsx';
import BottomNavBar from './BottomNavBar.jsx';
import CreatePostModal from './CreatePostModal.jsx';
import MainHeader from './MainHeader.jsx';
import PostDetailModal from './PostDetailModal.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Inicia en true
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  // --- LÍNEA CORREGIDA ---
  // Se elimina `userProfile` del array de dependencias de useCallback.
  // La función de fetching no debe depender del estado que ella misma establece.
  // Ahora solo depende de `user`, por lo que solo se recreará si el usuario cambia (logout/login).
  const fetchCoreData = useCallback(async () => {
    if (!user) return;
    
    // El estado de carga se gestiona en el useEffect principal para mayor control.
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
      // Opcional: Podríamos redirigir a una página de error o mostrar un mensaje.
    } finally {
      // setLoading(false) se moverá al useEffect para asegurar que se llame solo una vez.
    }
  }, [user]);

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
  
  // --- LÓGICA DE useEffect CORREGIDA ---
  // Se estructura para ejecutar el fetching de datos una sola vez cuando el componente se monta
  // o cuando el usuario cambia.
  useEffect(() => {
    setLoading(true); // Inicia la carga
    
    Promise.all([
        fetchCoreData(),
        fetchUnreadCount()
    ]).finally(() => {
        setLoading(false); // Finaliza la carga después de que AMBAS promesas se resuelvan
    });

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCoreData, fetchUnreadCount]);


  const handleMarkAsRead = useCallback(async () => {
    // ... (sin cambios)
  }, [user, fetchUnreadCount]);

  const handlePostCreated = (newPost) => {
    // ... (sin cambios)
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    // ... (El resto del JSX no necesita cambios)
    <div className={styles.container}>
      {isCreateModalOpen && (
        <CreatePostModal 
          userProfile={userProfile}
          pets={pets}
          onClose={() => setIsCreateModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      <MainHeader userProfile={userProfile} pets={pets} />

      <main>
        <Routes>
          <Route index element={<FeedPage userProfile={userProfile} pets={pets} />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage user={user} />} />
          <Route path="notifications" element={<NotificationsPage onMarkAsRead={handleMarkAsRead} />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchCoreData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchCoreData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile user={user} userProfile={userProfile} pets={pets} onUpdate={fetchCoreData} />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
          <Route path="notifications/post/:postId" element={<NotificationsPage onMarkAsRead={handleMarkAsRead} />} />
        </Routes>
      </main>

      <Routes>
        <Route path="notifications/post/:postId" element={<PostDetailModal />} />
      </Routes>

      <BottomNavBar 
        unreadCount={unreadCount}
        onOpenCreatePost={() => setIsCreateModalOpen(true)}
      />
    </div>
  );
}

export default ProfileLayout;