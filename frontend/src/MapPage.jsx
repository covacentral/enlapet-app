// frontend/src/MapPage.jsx
// Versión: 1.3 - Íconos del Mapa Corregidos
// Soluciona el bug de los íconos de marcador rotos.

import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet'; // Importamos la librería Leaflet
import { auth } from './firebase';
import LoadingComponent from './LoadingComponent';
import AddLocationModal from './AddLocationModal';
import { Plus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const initialPosition = [4.5709, -74.2973];

// *** CORRECCIÓN PARA LOS ÍCONOS ***
// Soluciona el problema de los íconos por defecto en Leaflet con React.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
// *** FIN DE LA CORRECCIÓN ***

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

  const fetchMapData = useCallback(async (categoryFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado.");
      const idToken = await user.getIdToken();
      
      const categoryUrl = `${API_URL}/api/location-categories`;
      let locationsUrl = `${API_URL}/api/locations`;
      if (categoryFilter) {
        locationsUrl += `?category=${categoryFilter}`;
      }

      const [categoriesRes, locationsRes] = await Promise.all([
        categories.length === 0 ? fetch(categoryUrl, { headers: { 'Authorization': `Bearer ${idToken}` } }) : Promise.resolve(null),
        fetch(locationsUrl, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (categoriesRes && !categoriesRes.ok) throw new Error('No se pudieron cargar las categorías.');
      if (!locationsRes.ok) throw new Error('No se pudieron cargar los lugares.');

      if (categoriesRes) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
      
      const locationsData = await locationsRes.json();
      setLocations(locationsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [categories]);

  useEffect(() => {
    fetchMapData(activeCategory);
  }, [activeCategory, fetchMapData]);

  const handleCategoryFilter = (categoryKey) => {
    setActiveCategory(prev => prev === categoryKey ? null : categoryKey);
  };
  
  if (isLoading && categories.length === 0) {
      return <LoadingComponent text="Cargando el mapa comunitario..." />;
  }

  return (
    <>
      {isModalOpen && <AddLocationModal categories={categories} onClose={() => setIsModalOpen(false)} onLocationAdded={() => fetchMapData(activeCategory)} />}
      
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
