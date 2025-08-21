// frontend/src/ProfileLayout.jsx
// Versión 4.9: Integra la página de notificaciones y el conteo de no leídos.

import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { CartProvider } from './context/CartContext';

import styles from './ProfileLayout.module.css';

// Importación de Páginas y Componentes
import FeedPage from './FeedPage.jsx';
import SavedPostsPage from './SavedPostsPage.jsx';
import MapPage from './MapPage.jsx';
import EventsPage from './EventsPage.jsx';
import SettingsTab from './SettingsTab.jsx';
import PetsTab from './PetsTab.jsx';
import PetSocialProfile from './PetSocialProfile.jsx';
import UserProfilePage from './UserProfilePage.jsx';
import AppointmentsTab from './AppointmentsTab.jsx';
import ProductPage from './ProductPage.jsx';
import CheckoutPage from './CheckoutPage.jsx';
import OrderConfirmationPage from './OrderConfirmationPage.jsx';
import LoadingComponent from './LoadingComponent.jsx';
import BottomNavBar from './BottomNavBar.jsx';
import CreatePostModal from './CreatePostModal.jsx';
import MainHeader from './MainHeader.jsx';
import PostDetailModal from './PostDetailModal.jsx';
import LostAndFoundPage from './LostAndFoundPage.jsx';
import RescueModeModal from './components/RescueModeModal.jsx';
// --- 1. Importamos la página de Notificaciones ---
import NotificationsPage from './NotificationsPage.jsx';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function ProfileLayout({ user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [missionContext, setMissionContext] = useState(null);
  const navigate = useNavigate();

  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);
  const [petForRescue, setPetForRescue] = useState(null);
  
  // --- 2. Nuevo estado para el conteo de notificaciones ---
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCoreData = useCallback(async () => {
    if (!user) return;
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
      setPets(Array.isArray(petsData) ? petsData : []);

    } catch (error) {
      console.error("Error fetching core data:", error);
      setPets([]);
    }
  }, [user]);

  // --- 3. Nueva función para obtener el conteo de no leídos ---
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            setUnreadCount(data.count);
        }
    } catch (error) {
        // No mostramos un error al usuario por esto, es una tarea de fondo.
        console.error("Error fetching unread count:", error);
    }
  }, [user]);

  // --- 4. useEffect para cargar datos y actualizar el conteo periódicamente ---
  useEffect(() => {
    setLoading(true);
    Promise.all([
        fetchCoreData(),
        fetchUnreadCount()
    ]).finally(() => setLoading(false));

    // Refresca el conteo de notificaciones cada 60 segundos
    const interval = setInterval(fetchUnreadCount, 60000); 
    return () => clearInterval(interval);
  }, [fetchCoreData, fetchUnreadCount]);

  // --- 5. Nueva función para marcar notificaciones como leídas ---
  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
        const idToken = await user.getIdToken();
        await fetch(`${API_URL}/api/notifications/mark-as-read`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        setUnreadCount(0); // Actualizamos el estado local inmediatamente
    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
  };


  const handleAcceptMission = (mission, petId) => {
    setMissionContext({ missionId: mission.id, petId: petId, missionHashtag: mission.hashtag });
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = (newPost) => {
    setIsCreateModalOpen(false);
    setMissionContext(null);
    if (newPost) {
      navigate('/dashboard');
    }
    fetchCoreData();
  };

  const handleOpenCreatePost = () => {
    setMissionContext(null);
    setIsCreateModalOpen(true);
  };
  
  const handleOpenRescueModal = (pet) => {
    setPetForRescue(pet);
    setIsRescueModalOpen(true);
  };

  const handleRescueSuccess = () => {
    fetchCoreData();
  };

  if (loading) return <LoadingComponent text="Cargando tu universo EnlaPet..." />;

  return (
    <div className={styles.container}>
      {isCreateModalOpen && ( <CreatePostModal userProfile={userProfile} pets={pets} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} missionContext={missionContext} /> )}
      
      {isRescueModalOpen && petForRescue && (
        <RescueModeModal 
            pet={petForRescue}
            onClose={() => setIsRescueModalOpen(false)}
            onSuccess={handleRescueSuccess}
        />
      )}

      <MainHeader 
        userProfile={userProfile} 
        pets={pets} 
        onAcceptMission={handleAcceptMission} 
        onOpenRescueModal={handleOpenRescueModal} 
      />

      <main>
        <Routes>
          <Route index element={<FeedPage userProfile={userProfile} pets={pets} />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage user={user} />} />
          <Route path="rescue" element={<LostAndFoundPage />} />
          <Route path="appointments" element={<AppointmentsTab userProfile={userProfile} />} />
          <Route path="saved" element={<SavedPostsPage />} />
          <Route path="pets" element={<PetsTab user={user} initialPets={pets} onPetsUpdate={fetchCoreData} />} />
          <Route path="settings" element={<SettingsTab user={user} userProfile={userProfile} onProfileUpdate={fetchCoreData} />} />
          <Route path="pet/:petId" element={<PetSocialProfile user={user} onUpdate={fetchCoreData} />} />
          <Route path="user/:userId" element={<UserProfilePage pets={pets} />} />
          <Route path="store/product/:productId" element={<ProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-confirmation" element={<OrderConfirmationPage />} />
          
          {/* --- 6. Añadimos la nueva ruta para la página de notificaciones --- */}
          <Route path="notifications" element={<NotificationsPage onMarkAsRead={handleMarkAsRead} />} />
        </Routes>
      </main>

      <Routes>
        <Route path="notifications/post/:postId" element={<PostDetailModal />} />
      </Routes>

      {/* --- 7. Pasamos el conteo de notificaciones a la barra de navegación --- */}
      <BottomNavBar onOpenCreatePost={handleOpenCreatePost} notificationCount={unreadCount} />
    </div>
  );
}

function ProfileLayoutWrapper({ user }) {
  return (
    <CartProvider>
      <ProfileLayout user={user} />
    </CartProvider>
  )
}

export default ProfileLayoutWrapper;