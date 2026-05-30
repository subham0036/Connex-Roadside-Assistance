import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { API_URL } from "../../config/api";
import "leaflet/dist/leaflet.css";

function LiveLocation() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Location not supported");
      return;
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);

        // Send to backend
        fetch(`${API_URL}/api/location/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, userId: "customer123" }),
        });
      },
      (err) => console.log(err),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div>
      <h2>Your Live Location</h2>

      {position && (
        <MapContainer
          center={position}
          zoom={16}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={position}>
            <Popup>You are here</Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
}

export default LiveLocation;