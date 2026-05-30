import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import LiveMap from "../../components/common/LiveMap";
import Toast from "../../components/common/Toast";
import { useStaffTracking } from "../../hooks/useStaffTracking";
import RequestDetailsModal from "../../components/garage/RequestDetailsModal";
import { requestTotalPaid } from "../../utils/requestPayments";
import "../../dashboards/Garage/GarageDashboard.css";

const STATUS_LABEL = {
  pending: "New",
  assigned: "Assigned",
  en_route: "En route",
  arrived: "Arrived",
  completed: "Done",
  cancelled: "Cancelled",
};

const LIVE_STATUSES = ["assigned", "en_route", "arrived"];

export default function GarageDashboard() {
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [garage, setGarage] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const seenIdsRef = useRef(null);
  const statusMapRef = useRef(null);
  const initialLoadRef = useRef(true);

  const liveRequest = requests.find((r) => LIVE_STATUSES.includes(r.status) && r.staffId);
  const staffLocation = useStaffTracking(liveRequest?._id, Boolean(liveRequest));

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 12000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadData = async () => {
    try {
      const [reqRes, staffRes, garageRes] = await Promise.all([
        api.get("/api/requests/mine"),
        api.get("/api/staff"),
        api.get("/api/garages/mine").catch(() => ({ data: null })),
      ]);
      const list = Array.isArray(reqRes.data) ? reqRes.data : [];
      setRequests(list);
      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      setGarage(garageRes.data);

      const pending = list.filter((r) => r.status === "pending");
      if (seenIdsRef.current === null) {
        seenIdsRef.current = new Set(pending.map((r) => String(r._id)));
        statusMapRef.current = new Map(list.map((r) => [String(r._id), r.status]));
        initialLoadRef.current = false;
      } else {
        pending.forEach((r) => {
          const id = String(r._id);
          if (!seenIdsRef.current.has(id)) {
            seenIdsRef.current.add(id);
            if (!initialLoadRef.current) {
              setToast({
                title: "New service request",
                body: `${r.customerName || r.customerId?.name || "Customer"} · ${r.issue} · ₹${r.fixedFee}`,
              });
            }
          }
        });

        list.forEach((r) => {
          const id = String(r._id);
          const prev = statusMapRef.current.get(id);
          if (prev && prev !== "completed" && r.status === "completed") {
            setToast({
              title: "Job completed",
              body: `${r.customerName || "Customer"} · Total ₹${requestTotalPaid(r)} collected (visit + on-site). Staff: ${r.assignedStaffName || "—"}`,
            });
          }
          statusMapRef.current.set(id, r.status);
        });
      }
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  if (!loading && !garage) {
    return (
      <div className="garage-page">
        <div className="premium-card empty-card">
          <h3>Set up your garage</h3>
          <p className="panel-sub">Use your shop&apos;s real GPS pin so customers see accurate distance.</p>
          <Link to="/garage/setup" className="btn-primary">
            Register garage
          </Link>
        </div>
      </div>
    );
  }

  const customerLoc = liveRequest?.requestLocation;
  const mapCenter =
    customerLoc?.lat != null
      ? { lat: customerLoc.lat, lng: customerLoc.lng }
      : staffLocation?.lat
        ? { lat: staffLocation.lat, lng: staffLocation.lng }
        : garage?.location;

  const mapMarkers = [];
  if (staffLocation?.lat) {
    mapMarkers.push({
      lat: staffLocation.lat,
      lng: staffLocation.lng,
      label: "Your staff",
      type: "staff",
    });
  }
  if (garage?.location?.lat != null) {
    mapMarkers.push({
      lat: garage.location.lat,
      lng: garage.location.lng,
      label: "Garage",
      type: "garage",
    });
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="garage-page">
      <Toast alert={toast} onDismiss={() => setToast(null)} />

      <header className="page-head">
        <span className="eyebrow">Partner portal</span>
        <h1>{garage?.shopName}</h1>
        <p className="hero-copy">
          Visit fee ₹{garage?.fixedFee} · {staff.length} staff ·{" "}
          <strong>{pendingCount} new request{pendingCount !== 1 ? "s" : ""}</strong>
        </p>
      </header>

      {liveRequest && mapCenter?.lat != null && (
        <section className="premium-card live-track-panel">
          <h3>Live staff tracking</h3>
          <p className="panel-sub">
            {liveRequest.assignedStaffName} → {liveRequest.customerName || "customer"} (
            {STATUS_LABEL[liveRequest.status]})
          </p>
          <div className="map-wrapper">
            <LiveMap
              lat={mapCenter.lat}
              lng={mapCenter.lng}
              label="Customer breakdown"
              markers={mapMarkers}
              height="340px"
              centerType="customer"
            />
          </div>
        </section>
      )}

      {loading ? (
        <p className="panel-sub">Loading...</p>
      ) : requests.length > 0 ? (
        <div className="requests-grid">
          {requests.map((req) => (
            <button
              type="button"
              key={req._id}
              className={`premium-card request-tile ${req.status === "pending" ? "request-tile--new" : ""}`}
              onClick={() => setSelectedRequest(req)}
            >
              <div>
                <h3>{req.issue}</h3>
                <p>{req.customerName || req.customerId?.name} · {req.phone}</p>
                <p>{req.vehicleType}</p>
              </div>
              <div className="request-tile-meta">
                <span className={`status-badge status-${req.status}`}>{STATUS_LABEL[req.status]}</span>
                <div className="request-amounts">
                  <strong>₹{requestTotalPaid(req)}</strong>
                  <span className="request-amount-breakdown">
                    visit ₹{req.fixedFee}
                    {req.repairAmount > 0 ? ` + repair ₹${req.repairAmount}` : req.status === "completed" ? "" : " + on-site?"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="premium-card empty-card">
          <h3>No requests yet</h3>
          <p className="panel-sub">Paid customer requests appear here with a popup alert.</p>
        </div>
      )}

      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          staff={staff}
          onClose={() => setSelectedRequest(null)}
          onUpdated={() => {
            setSelectedRequest(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
