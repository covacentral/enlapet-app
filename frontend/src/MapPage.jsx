// frontend/src/MapPage.jsx
// Versión: 1.6 - Navegación Libre
// CORRIGE: El bug crítico que causaba un bucle de recentrado en el mapa.
// ELIMINADO: Se elimina el componente <ChangeView /> que forzaba el reseteo
// de la vista en cada renderizado. Ahora el mapa se centra una vez en la
// geolocalización del usuario y luego permite la navegación libre.

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AddLocationModal from './AddLocationModal';
import CreateEventModal from './CreateEventModal';
import { Plus, Map, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973];

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapPage() {
  const [viewMode, setViewMode] = useState('locations');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(initialPosition);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setMapCenter(coords);
        if (mapInstance) {
          mapInstance.setView(coords, 13);
        }
      },
      () => setMapCenter(initialPosition)
    );
  }, [mapInstance]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setItems([]);
    setCategories([]);
    setActiveCategory(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();

      const isLocationsView = viewMode === 'locations';
      const categoriesUrl = isLocationsView ? `${API_URL}/api/location-categories` : `${API_URL}/api/event-categories`;
      let itemsUrl = isLocationsView ? `${API_URL}/api/locations` : `${API_URL}/api/events`;
      
      const [categoriesRes, itemsRes] = await Promise.all([
        fetch(categoriesUrl, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(itemsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (!categoriesRes.ok) throw new Error('No se pudieron cargar las categorías.');
      if (!itemsRes.ok) throw new Error(isLocationsView ? 'No se pudieron cargar los lugares.' : 'No se pudieron cargar los eventos.');

      const categoriesData = await categoriesRes.json();
      const itemsData = await itemsRes.json();

      setCategories(categoriesData);
      setItems(itemsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryFilter = async (categoryKey) => {
    const newFilter = activeCategory === categoryKey ? null : categoryKey;
    setActiveCategory(newFilter);
    
    setIsLoading(true);
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado.");
        const idToken = await user.getIdToken();
        const isLocationsView = viewMode === 'locations';
        let itemsUrl = isLocationsView ? `${API_URL}/api/locations` : `${API_URL}/api/events`;
        if (newFilter) {
            itemsUrl += `?category=${newFilter}`;
        }
        const itemsRes = await fetch(itemsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } });
        if (!itemsRes.ok) throw new Error('Error al filtrar.');
        setItems(await itemsRes.json());
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading && items.length === 0) {
      return <LoadingComponent text="Cargando el mapa comunitario..." />;
  }

  return (
    <>
      {isModalOpen && viewMode === 'locations' && <AddLocationModal categories={categories} onClose={() => setIsModalOpen(false)} onLocationAdded={fetchData} />}
      {isModalOpen && viewMode === 'events' && <CreateEventModal onClose={() => setIsModalOpen(false)} onEventCreated={fetchData} />}

      <div className="map-page-container">
        <div className="map-header">
            <h2 className="tab-title">Mapa Comunitario</h2>
            <div className="map-view-toggle">
                <button onClick={() => setViewMode('locations')} className={viewMode === 'locations' ? 'active' : ''}><Map size={16}/> Lugares</button>
                <button onClick={() => setViewMode('events')} className={viewMode === 'events' ? 'active' : ''}><Calendar size={16}/> Eventos</button>
            </div>
            <button className="add-location-button" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> {viewMode === 'locations' ? 'Añadir Lugar' : 'Crear Evento'}
            </button>
        </div>

        <div className="map-filter-bar">
          <button className={`filter-button ${!activeCategory ? 'active' : ''}`} onClick={() => handleCategoryFilter(null)}>Todos</button>
          {categories.map(cat => (
            <button key={cat.id} className={`filter-button ${activeCategory === cat.key ? 'active' : ''}`} onClick={() => handleCategoryFilter(cat.key)}>{cat.name}</button>
          ))}
        </div>

        {error && <p className="response-message error">{error}</p>}

        <div className="map-wrapper">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="leaflet-container" whenCreated={setMapInstance}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            {items.map(item => {
              const position = item.coordinates ? [item.coordinates._latitude, item.coordinates._longitude] : (item.customLocation ? [item.customLocation.coordinates._latitude, item.customLocation.coordinates._longitude] : null);
              if (!position) return null;
              return (
                <Marker key={item.id} position={position}>
                  <Popup><strong>{item.name}</strong></Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default MapPage;