import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Landsat9Map = () => {
  const [mouseCoordinates, setMouseCoordinates] = useState({ lat: 37.7749, lng: -122.4194 });
  const [landsatCoordinates, setLandsatCoordinates] = useState(null);
  const [landsatData, setLandsatData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const LocationMarker = () => {
    useMapEvents({
      mousemove(e) {
        setMouseCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return <Marker position={mouseCoordinates}><Popup>Mouse Location</Popup></Marker>;
  };

  const fetchLandsatData = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get('https://landsatlook.usgs.gov/sat-api/collections/landsat-c2l2-sr/items', {
        params: {
          datetime: `${formattedDate}T00:00:00Z/${formattedDate}T23:59:59Z`,
          bbox: [mouseCoordinates.lng - 1, mouseCoordinates.lat - 1, mouseCoordinates.lng + 1, mouseCoordinates.lat + 1],
          limit: 1,
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const landsatFeature = response.data.features[0];
        setLandsatData(landsatFeature);
        setLandsatCoordinates({
          lat: landsatFeature.geometry.coordinates[1],
          lng: landsatFeature.geometry.coordinates[0],
        });
      } else {
        setLandsatData(null);
        setLandsatCoordinates(null);
      }
    } catch (error) {
      setError('Error fetching Landsat data');
      console.error('Error fetching Landsat data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandsatData(selectedDate);
  }, [selectedDate, mouseCoordinates]);

  return (
    <div className="map-container">
      <h2>Landsat 9 Data Viewer</h2>
      <div className="date-picker">
        <label>Select Date: </label>
        <DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} />
      </div>
      <MapContainer center={mouseCoordinates} zoom={13} style={{ height: '100vh', width: '100vw' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationMarker />
        {landsatCoordinates && (
          <Marker position={landsatCoordinates}>
            <Popup>Landsat Position</Popup>
          </Marker>
        )}
      </MapContainer>
      {loading && <p className="loading">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {landsatData && (
        <div className="landsat-data">
          <h3>Landsat Data on {selectedDate.toDateString()}</h3>
          <pre>{JSON.stringify(landsatData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Landsat9Map;
