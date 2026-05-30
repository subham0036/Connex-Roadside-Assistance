import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import LocationPickerMap from "../../components/maps/LocationPickerMap";
import "../../components/maps/LocationPickerMap.css";
import "../../dashboards/Garage/GarageDashboard.css";

function captureCurrentLocation(setForm, setLocationOk, setError) {
  if (!navigator.geolocation) {
    setError("Your browser does not support location. Try Chrome or Safari on mobile.");
    return;
  }
  setError("");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setForm((f) => ({
        ...f,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }));
      setLocationOk(true);
    },
    () => setError("Allow location access so customers can find your shop nearby.")
  );
}

export default function GarageSetup() {
  const navigate = useNavigate();
  const [locationMode, setLocationMode] = useState("gps");
  const [form, setForm] = useState({
    shopName: "",
    phone: "",
    address: "",
    fixedFee: 249,
    lat: "",
    lng: "",
    services: "Tyre Repair, Battery Jump, Engine Repair, Fuel Delivery",
    mapNote: "",
  });
  const [locationOk, setLocationOk] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(null);

  const applyCoords = (lat, lng) => {
    setForm((f) => ({ ...f, lat, lng }));
    setLocationOk(true);
  };

  useEffect(() => {
    api
      .get("/api/garages/mine")
      .then((res) => {
        setExisting(res.data);
        const lat = res.data.location?.lat;
        const lng = res.data.location?.lng;
        setForm({
          shopName: res.data.shopName,
          phone: res.data.phone,
          address: res.data.address,
          fixedFee: res.data.fixedFee,
          lat: lat || "",
          lng: lng || "",
          services: (res.data.services || []).join(", "),
        });
        if (lat && lng) {
          setLocationOk(true);
          setLocationMode("map");
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      setError("Set your shop location using GPS or pick a point on the map.");
      return;
    }
    setLoading(true);
    setError("");
    const payload = {
      shopName: form.shopName,
      phone: form.phone,
      address: form.address,
      fixedFee: Number(form.fixedFee),
      lat: Number(form.lat),
      lng: Number(form.lng),
      services: form.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (existing) {
        await api.put("/api/garages/mine", payload);
      } else {
        await api.post("/api/garages/register", payload);
      }
      navigate("/garage");
    } catch (err) {
      setError(err.response?.data?.msg || "Could not save garage profile.");
    }
    setLoading(false);
  };

  return (
    <div className="garage-page">
      <div className="page-head">
        <span className="eyebrow">Garage listing</span>
        <h1>{existing ? "Update your garage" : "List your garage on Connex"}</h1>
        <p className="hero-copy">
          Set your visit fee and shop location — use live GPS or pin your shop on the map (Rapido-style).
        </p>
      </div>

      <form className="premium-card garage-setup-form" onSubmit={handleSubmit}>
        <label>Shop name</label>
        <input
          value={form.shopName}
          onChange={(e) => setForm({ ...form, shopName: e.target.value })}
          required
        />

        <label>Shop phone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />

        <label>Shop address (for customers)</label>
        <input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Building, street, area, city"
          required
        />

        <label>Fixed visit fee (₹)</label>
        <input
          type="number"
          min="99"
          value={form.fixedFee}
          onChange={(e) => setForm({ ...form, fixedFee: e.target.value })}
          required
        />
        <p className="section-copy">
          Customers pay this before you dispatch staff — covers travel even if repair takes longer.
        </p>

        <label>Shop location on map</label>
        <div className="location-mode-tabs">
          <button
            type="button"
            className={`location-mode-tab ${locationMode === "gps" ? "active" : ""}`}
            onClick={() => setLocationMode("gps")}
          >
            Current location
          </button>
          <button
            type="button"
            className={`location-mode-tab ${locationMode === "map" ? "active" : ""}`}
            onClick={() => setLocationMode("map")}
          >
            Pick on map
          </button>
        </div>

        {locationMode === "gps" && (
          <>
            <button
              type="button"
              className="gps-btn"
              onClick={() => captureCurrentLocation(setForm, setLocationOk, setError)}
            >
              Use my current GPS location
            </button>
            <p className="section-copy">Stand at your shop entrance for best accuracy.</p>
          </>
        )}

        {locationMode === "map" && (
          <>
            <div className="form-field manual-address-field">
              <label>Landmark / directions (optional)</label>
              <input
                value={form.mapNote || ""}
                onChange={(e) => setForm({ ...form, mapNote: e.target.value })}
                placeholder="Near metro, opposite petrol pump..."
              />
            </div>
            <LocationPickerMap
              lat={form.lat}
              lng={form.lng}
              height={340}
              onPick={(lat, lng) => applyCoords(lat, lng)}
            />
          </>
        )}

        <div className={`location-set-badge ${locationOk ? "" : "pending"}`}>
          {locationOk
            ? `Pin saved · ${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}`
            : locationMode === "gps"
              ? "Tap GPS button to capture location"
              : "Tap the map to drop your shop pin"}
        </div>

        <label>Services (comma separated)</label>
        <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />

        {error && <p className="form-error">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading || !locationOk}>
          {loading ? "Saving..." : existing ? "Update garage" : "List my garage"}
        </button>
      </form>
    </div>
  );
}
