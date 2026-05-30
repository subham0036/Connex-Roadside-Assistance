import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./LocationPickerMap.css";

const DEFAULT_CENTER = [28.6139, 77.209];

const pinIcon = L.divIcon({
  className: "pick-marker",
  html: `<div class="pick-marker-dot"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapCenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

function MapClickPick({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ lat, lng, onPick, height = 320 }) {
  const hasPoint = lat != null && lng != null && !Number.isNaN(Number(lat));
  const center = hasPoint ? [Number(lat), Number(lng)] : DEFAULT_CENTER;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="location-picker-map loading" style={{ height }} />;
  }

  return (
    <div className="location-picker-map" style={{ height }}>
      <p className="location-picker-hint">Tap on the map to place your shop pin (like Rapido)</p>
      <MapContainer center={center} zoom={hasPoint ? 16 : 12} className="location-picker-leaflet">
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickPick onPick={onPick} />
        {hasPoint && (
          <Marker
            position={[Number(lat), Number(lng)]}
            icon={pinIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat: la, lng: ln } = e.target.getLatLng();
                onPick(la, ln);
              },
            }}
          />
        )}
        <MapCenter lat={lat} lng={lng} />
      </MapContainer>
    </div>
  );
}
