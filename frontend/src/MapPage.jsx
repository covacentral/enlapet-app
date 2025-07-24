// frontend/src/MapPage.jsx
// Versión: 1.2 - Geolocalización, Nuevo Tema y Correcciones
// Centra el mapa en la ubicación del usuario, mejora el tema visual y corrige bugs.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AddLocationModal from './AddLocationModal';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973]; // Centro de Colombia (fallback)

// Componente para cambiar la vista del mapa dinámicamente
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function MapPage() {
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(initialPosition);

  // Geolocalización al montar el componente
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        console.log("No se pudo obtener la ubicación, usando la ubicación por defecto.");
        setMapCenter(initialPosition);
      }
    );
  }, []);

  const fetchCategories = useCallback(async (idToken) => {
    try {
      const categoryUrl = `${API_URL}/api/location-categories`;
      const categoriesRes = await fetch(categoryUrl, { headers: { 'Authorization': `Bearer ${idToken}` } });
      if (!categoriesRes.ok) throw new Error('No se pudieron cargar las categorías.');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchLocations = useCallback(async (idToken, categoryFilter) => {
    try {
      let locationsUrl = `${API_URL}/api/locations`;
      if (categoryFilter) {
        locationsUrl += `?category=${categoryFilter}`;
      }
      const locationsRes = await fetch(locationsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } });
      if (!locationsRes.ok) throw new Error('No se pudieron cargar los lugares.');
      const locationsData = await locationsRes.json();
      setLocations(locationsData);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      await Promise.all([
        fetchCategories(idToken),
        fetchLocations(idToken, activeCategory)
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
        user.getIdToken().then(idToken => fetchLocations(idToken, activeCategory));
    }
  }, [activeCategory, fetchLocations]);


  const handleCategoryFilter = (categoryKey) => {
    setActiveCategory(prev => prev === categoryKey ? null : categoryKey);
  };
  
  if (isLoading && categories.length === 0) {
      return <LoadingComponent text="Cargando el mapa comunitario..." />;
  }

  return (
    <>
      {isModalOpen && <AddLocationModal categories={categories} onClose={() => setIsModalOpen(false)} onLocationAdded={() => fetchLocations(auth.currentUser.accessToken, activeCategory)} />}
      
      <div className="map-page-container">
        <div className="map-header">
            <h2 className="tab-title">Mapa Comunitario</h2>
            <button className="add-location-button" onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Añadir Lugar
            </button>
        </div>

        <div className="map-filter-bar">
          <button 
            className={`filter-button ${!activeCategory ? 'active' : ''}`}
            onClick={() => handleCategoryFilter(null)}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`filter-button ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(cat.key)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {error && <p className="response-message error">{error}</p>}

        <div className="map-wrapper">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="leaflet-container">
            <ChangeView center={mapCenter} zoom={13} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {locations.map(loc => (
              <Marker key={loc.id} position={[loc.coordinates._latitude, loc.coordinates._longitude]}>
                <Popup>
                  <strong>{loc.name}</strong><br />
                  {loc.address || 'Dirección no especificada.'}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </>
  );
}

export default MapPage;
