import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Importa los estilos de Leaflet
import L from 'leaflet'; // Importa Leaflet para manejar un bug con los iconos

import api from './services/api';
import LoadingComponent from './LoadingComponent';

// --- Corrección para el icono por defecto de Leaflet ---
// Webpack a veces no carga los iconos correctamente. Esta es la solución estándar.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// --- Fin de la corrección ---

const MapPage = () => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Posición inicial del mapa (centrado en Bogotá, Colombia)
  const initialPosition = [4.60971, -74.08175];

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/locations');
        setLocations(response.data);
      } catch (err) {
        setError("No se pudieron cargar las ubicaciones.");
        console.error("Error al obtener las ubicaciones:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="map-page">
      <div className="page-header">
        <h2>Mapa Comunitario</h2>
        <button className="add-location-button">+ Sugerir Lugar</button>
      </div>

      <div className="map-container-wrapper">
        <MapContainer center={initialPosition} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {locations.map(loc => (
            // Asegurarse que las coordenadas existan y tengan el formato correcto
            loc.coordinates && loc.coordinates.latitude && loc.coordinates.longitude && (
              <Marker key={loc.id} position={[loc.coordinates.latitude, loc.coordinates.longitude]}>
                <Popup>
                  <strong>{loc.name}</strong><br />
                  {loc.description}<br />
                  <small>Categoría: {loc.category}</small>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPage;
