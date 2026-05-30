import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import LiveMap from "../../components/common/LiveMap";
import "./CustomerDashboard.css";

export default function CustomerNewRequest() {
  const navigate = useNavigate();
  const [details, setDetails] = useState({ name: "", phone: "", vehicleType: "", issue: "", locationNote: "" });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [locating, setLocating] = useState(false);
  const [garages, setGarages] = useState([]);
  const [searchMeta, setSearchMeta] = useState({ radiusKm: 25, count: 0 });
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("details");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [feeAccepted, setFeeAccepted] = useState(false);

  const refreshLocation = useCallback(() => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMessage("Enable GPS to find nearby garages.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("connex_user") || "{}");
    setDetails((d) => ({
      ...d,
      name: d.name || user.name || "",
      phone: d.phone || user.phone || "",
    }));
    refreshLocation();
  }, [refreshLocation]);

  const formValid =
    details.name.trim() &&
    details.phone.trim() &&
    details.vehicleType.trim() &&
    details.issue &&
    location.lat != null &&
    location.lng != null;

  const fetchGarages = async () => {
    if (!formValid) {
      setMessage("Fill all fields and enable GPS.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await api.get(
        `/api/garages/nearby?lat=${location.lat}&lng=${location.lng}&radiusKm=25`
      );
      const list = res.data.garages || [];
      setGarages(Array.isArray(list) ? list : []);
      setSearchMeta({ radiusKm: res.data.radiusKm || 25, count: res.data.count ?? list.length });
      setStep("garages");
      if (!list.length) setMessage("No garages within 25 km. Try again from a different location.");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Could not search garages.");
    }
    setLoading(false);
  };

  const handleRequest = async () => {
    if (!selectedGarage || !feeAccepted) return;
    setLoading(true);
    setMessage("");
    try {
      await api.post("/api/requests/create", {
        issue: details.issue,
        vehicleType: details.vehicleType,
        phone: details.phone,
        note: details.locationNote,
        garageId: selectedGarage._id,
        paymentMethod,
        fixedFeePaid: true,
        location: {
          lat: Number(location.lat),
          lng: Number(location.lng),
          address: details.locationNote || "GPS location",
          note: details.locationNote,
        },
      });
      navigate("/customer/active");
    } catch (err) {
      const msg = err.response?.data?.msg || "Request failed. Please try again.";
      setMessage(msg);
      if (msg.includes("active request")) {
        setTimeout(() => navigate("/customer/active"), 1500);
      }
    }
    setLoading(false);
  };

  const mapMarkers =
    selectedGarage?.location?.lat != null
      ? [
          {
            lat: selectedGarage.location.lat,
            lng: selectedGarage.location.lng,
            label: selectedGarage.shopName,
            type: "garage",
          },
        ]
      : [];

  return (
    <div className="customer-page">
      <header className="customer-header">
        <p className="eyebrow">New request</p>
        <h1>Report breakdown</h1>
        <p className="hero-copy">Enter details, then find garages within 25 km.</p>
      </header>

      <div className="customer-layout">
        <section className="premium-card">
          {step === "details" && (
            <>
              <h2>Vehicle & location</h2>
              <div className="form-field">
                <label>Name</label>
                <input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Vehicle</label>
                <input
                  value={details.vehicleType}
                  onChange={(e) => setDetails({ ...details, vehicleType: e.target.value })}
                  placeholder="Car, bike..."
                />
              </div>
              <div className="form-field">
                <label>Problem</label>
                <select value={details.issue} onChange={(e) => setDetails({ ...details, issue: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Flat Tyre">Flat Tyre</option>
                  <option value="Engine Failure">Engine Failure</option>
                  <option value="Car Not Starting">Car Not Starting</option>
                  <option value="Battery Jump Start">Battery Jump</option>
                  <option value="Fuel Empty">Fuel Empty</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>Landmark</label>
                <textarea
                  value={details.locationNote}
                  onChange={(e) => setDetails({ ...details, locationNote: e.target.value })}
                  placeholder="Highway km marker..."
                />
              </div>
              <button type="button" className="gps-btn" onClick={refreshLocation} disabled={locating}>
                {locating ? "GPS..." : "Refresh GPS"}
              </button>
              <div className="sticky-bottom-bar">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={fetchGarages}
                  disabled={!formValid || loading}
                >
                  {loading ? "Searching..." : "Find nearby garages"}
                </button>
              </div>
            </>
          )}
          {step === "garages" && (
            <>
              <button type="button" className="btn-secondary back-btn" onClick={() => setStep("details")}>
                ← Back
              </button>
              <h2>Nearby · {searchMeta.count} garages</h2>
              <div className="garage-list">
                {garages.map((g) => (
                  <button
                    key={g._id}
                    type="button"
                    className="garage-card"
                    onClick={() => {
                      setSelectedGarage(g);
                      setStep("pay");
                    }}
                  >
                    <div>
                      <h3>{g.shopName}</h3>
                      <p>{g.address}</p>
                      <p className="garage-fee">₹{g.fixedFee}</p>
                    </div>
                    <span className="distance-pill">
                      {typeof g.distance === "number" ? `${g.distance.toFixed(1)} km` : "—"}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "pay" && selectedGarage && (
            <>
              <h2>Pay visit fee · {selectedGarage.shopName}</h2>
              <p className="fee-big">₹{selectedGarage.fixedFee}</p>
              <p className="pay-methods-hint">
                Pay the visit fee any way you like — UPI/QR, cash, or card. Pick how you will pay.
              </p>
              <div className="payment-method-grid" role="group" aria-label="Visit fee payment method">
                {[
                  { value: "UPI", label: "UPI / QR", sub: "GPay, PhonePe, Paytm" },
                  { value: "Cash", label: "Cash", sub: "Pay on arrival" },
                  { value: "Card", label: "Card", sub: "Debit or credit" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`payment-method-btn${paymentMethod === opt.value ? " selected" : ""}`}
                    onClick={() => setPaymentMethod(opt.value)}
                  >
                    <span className="payment-method-label">{opt.label}</span>
                    <span className="payment-method-sub">{opt.sub}</span>
                  </button>
                ))}
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={feeAccepted}
                  onChange={(e) => setFeeAccepted(e.target.checked)}
                />
                I agree to pay ₹{selectedGarage.fixedFee}
              </label>
              <button
                type="button"
                className="btn-primary"
                disabled={!feeAccepted || loading}
                onClick={handleRequest}
              >
                {loading ? "Sending..." : "Confirm & send"}
              </button>
            </>
          )}
          {message && (
            <p className={message.includes("active") ? "toast-error" : message.includes("No garages") ? "toast-error" : "toast-error"}>
              {message}
            </p>
          )}
        </section>
        <section className="premium-card map-panel">
          <h2>Your location</h2>
          <div className="map-wrap">
            {location.lat != null ? (
              <LiveMap lat={location.lat} lng={location.lng} label="You" markers={mapMarkers} height="380px" />
            ) : (
              <div className="map-empty">Enable GPS</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
