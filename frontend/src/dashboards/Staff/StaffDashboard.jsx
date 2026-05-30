import React, { useEffect, useState } from "react";
import api from "../../config/api";
import LiveMap from "../../components/common/LiveMap";
import JobStatusTimeline from "../../components/jobs/JobStatusTimeline";
import { formatPaymentMethod } from "../../utils/requestPayments";
import { usePublishStaffLocation } from "../../hooks/useStaffTracking";
import "./StaffDashboard.css";

const STATUS_ACTIONS = {
  assigned: { next: "en_route", label: "Start navigation to customer" },
  en_route: { next: "arrived", label: "Arrived at breakdown" },
};

const PAYMENT_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Card", label: "Card" },
  { value: "UPI", label: "UPI / QR scan" },
];

export default function StaffDashboard() {
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [activeJob, setActiveJob] = useState(null);
  const [repairAmount, setRepairAmount] = useState("");
  const [repairPaymentMethod, setRepairPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showDoneModal, setShowDoneModal] = useState(false);

  const trackingOn = activeJob && ["assigned", "en_route", "arrived"].includes(activeJob.status);
  usePublishStaffLocation(activeJob?._id, trackingOn);

  useEffect(() => {
    loadJobs();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    const poll = setInterval(loadJobs, 6000);
    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(poll);
    };
  }, []);

  const loadJobs = async () => {
    try {
      const res = await api.get("/api/requests/mine");
      const list = Array.isArray(res.data) ? res.data : [];
      setActiveJob(list.find((j) => !["completed", "cancelled"].includes(j.status)) || null);
    } catch {
      setActiveJob(null);
    }
  };

  const updateStatus = async (jobId, status) => {
    setLoading(true);
    setMessage("");
    try {
      if (status === "completed") {
        await api.post(`/api/requests/${jobId}/complete`, {
          repairAmount: Number(repairAmount) || 0,
          repairPaymentMethod,
        });
        setShowDoneModal(true);
        setRepairAmount("");
        setRepairPaymentMethod("Cash");
      } else {
        await api.post(`/api/requests/${jobId}/status`, { status });
        setMessage("Status updated.");
      }
      await loadJobs();
    } catch (err) {
      setMessage(err.response?.data?.msg || "Update failed.");
    }
    setLoading(false);
  };

  const customerLoc = activeJob?.requestLocation;
  const mapCenter = customerLoc?.lat != null ? { lat: customerLoc.lat, lng: customerLoc.lng } : location;
  const markers = [];
  if (location?.lat != null && customerLoc?.lat != null) {
    const dLat = Math.abs(Number(location.lat) - Number(customerLoc.lat));
    const dLng = Math.abs(Number(location.lng) - Number(customerLoc.lng));
    if (dLat > 0.0001 || dLng > 0.0001) {
      markers.push({
        lat: Number(location.lat),
        lng: Number(location.lng),
        label: "You (staff)",
        type: "staff",
      });
    }
  }

  return (
    <div className="page-container staff-dashboard">
      {showDoneModal && (
        <div className="completion-overlay" role="dialog">
          <div className="completion-modal premium-card">
            <div className="completion-icon">✓</div>
            <h2>Job marked complete</h2>
            <p className="panel-sub">
              Payment record sent to your garage owner (visit + on-site repair). Customer is notified.
            </p>
            <button type="button" className="btn-primary" onClick={() => setShowDoneModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      <header className="page-head">
        <p className="eyebrow">Staff dashboard</p>
        <h1 className="page-title">Go to customer & complete repair</h1>
        <p className="hero-copy">
          Sign in anytime at <strong>/staff/login</strong> with your work email. After repair, record how
          the customer paid (cash, card, or UPI/QR).
        </p>
      </header>

      {trackingOn && (
        <div className="tracking-banner">
          <span className="pulse-dot" />
          <span>Live GPS on — customer and garage can track you</span>
        </div>
      )}

      {!activeJob ? (
        <div className="premium-card">
          <h3>Waiting for assignment</h3>
          <p className="panel-sub">
            Your garage owner assigns you from their dashboard. You can close the browser and return
            later — bookmark <strong>Staff sign-in</strong> on the main login page.
          </p>
        </div>
      ) : (
        <div className="staff-job-grid">
          <div className="premium-card">
            <JobStatusTimeline status={activeJob.status} compact />
            <h3>{activeJob.issue}</h3>
            <p>
              <strong>{activeJob.vehicleType}</strong>
            </p>
            <p>Customer: {activeJob.customerName || activeJob.customerId?.name}</p>
            <p>
              Phone:{" "}
              <a href={`tel:${activeJob.phone}`}>{activeJob.phone}</a>
            </p>

            <div className="staff-visit-paid">
              <span>Visit fee (already paid by customer)</span>
              <strong>₹{activeJob.fixedFee}</strong>
              <span className="payment-method-tag">
                {formatPaymentMethod(activeJob.fixedFeePaymentMethod || activeJob.paymentMethod)}
              </span>
            </div>

            {customerLoc?.lat != null && (
              <a
                className="btn-primary nav-link-btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${customerLoc.lat},${customerLoc.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Navigate in Google Maps
              </a>
            )}
            {STATUS_ACTIONS[activeJob.status] && (
              <button
                type="button"
                className="rescue-btn"
                disabled={loading}
                onClick={() => updateStatus(activeJob._id, STATUS_ACTIONS[activeJob.status].next)}
              >
                {STATUS_ACTIONS[activeJob.status].label}
              </button>
            )}
            {activeJob.status === "arrived" && (
              <div className="staff-payment-block">
                <h4>Complete job — on-site payment</h4>
                <p className="panel-sub">
                  Enter extra repair charges (₹0 if only visit fee). Select how the customer paid you
                  on-site. Your garage owner sees the full total to prevent cheating.
                </p>
                <div className="form-field">
                  <label>Extra repair amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={repairAmount}
                    onChange={(e) => setRepairAmount(e.target.value)}
                    placeholder="0 if no extra charge"
                  />
                </div>
                <label className="login-pro-label">Customer paid on-site via</label>
                <div className="payment-method-options">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label key={opt.value}>
                      <input
                        type="radio"
                        name="repairPay"
                        value={opt.value}
                        checked={repairPaymentMethod === opt.value}
                        onChange={() => setRepairPaymentMethod(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="rescue-btn"
                  disabled={loading}
                  onClick={() => updateStatus(activeJob._id, "completed")}
                >
                  Complete job & send payment record
                </button>
              </div>
            )}
            {message && (
              <p className={message.includes("updated") ? "toast-success" : "toast-error"}>{message}</p>
            )}
          </div>
          <div className="premium-card map-panel">
            <h3>Customer location</h3>
            <LiveMap
              lat={mapCenter.lat}
              lng={mapCenter.lng}
              label="Customer breakdown"
              markers={markers}
              height="400px"
              centerType="customer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
