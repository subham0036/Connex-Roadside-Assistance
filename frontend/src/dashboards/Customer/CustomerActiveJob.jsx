import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import LiveMap from "../../components/common/LiveMap";
import RequestChat from "../../components/chat/RequestChat";
import JobStatusTimeline from "../../components/jobs/JobStatusTimeline";
import CompletionModal from "../../components/jobs/CompletionModal";
import { useStaffTracking } from "../../hooks/useStaffTracking";
import "./CustomerDashboard.css";

const STATUS_LABEL = {
  pending: "Waiting for garage",
  assigned: "Mechanic assigned",
  en_route: "On the way",
  arrived: "At your location",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TRACKING = ["assigned", "en_route", "arrived"];

export default function CustomerActiveJob() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedJob, setCompletedJob] = useState(null);
  const trackedActiveId = useRef(null);

  const active = requests.find((r) => !["completed", "cancelled"].includes(r.status));
  const activeId = active?._id ? String(active._id) : null;
  const staffLocation = useStaffTracking(activeId, Boolean(active && TRACKING.includes(active.status)));

  const mapMarkers = useMemo(() => {
    if (!active || staffLocation?.lat == null) return [];
    return [
      {
        lat: Number(staffLocation.lat),
        lng: Number(staffLocation.lng),
        label: active.assignedStaffName || "Mechanic",
        type: "staff",
      },
    ];
  }, [active, staffLocation]);

  const loadRequests = async () => {
    try {
      const res = await api.get("/api/requests/mine");
      const list = Array.isArray(res.data) ? res.data : [];

      if (trackedActiveId.current) {
        const prev = list.find((r) => String(r._id) === trackedActiveId.current);
        if (prev?.status === "completed") {
          setCompletedJob(prev);
          trackedActiveId.current = null;
        }
      }

      const nextActive = list.find((r) => !["completed", "cancelled"].includes(r.status));
      if (nextActive) {
        trackedActiveId.current = String(nextActive._id);
      } else {
        trackedActiveId.current = null;
      }

      setRequests(list);
    } catch {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
    const t = setInterval(loadRequests, 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="customer-page">
        <p className="panel-sub">Loading...</p>
      </div>
    );
  }

  if (completedJob) {
    return (
      <div className="customer-page">
        <CompletionModal job={completedJob} onClose={() => setCompletedJob(null)} />
      </div>
    );
  }

  if (!active) {
    return (
      <div className="customer-page">
        <div className="premium-card empty-state-card">
          <h2>No active job</h2>
          <p className="panel-sub">
            Finished repairs appear under <strong>Completed</strong> in the sidebar.
          </p>
          <Link to="/customer/completed" className="btn-secondary">
            View completed
          </Link>
          <Link to="/customer" className="btn-primary" style={{ marginTop: 12 }}>
            New request
          </Link>
        </div>
      </div>
    );
  }

  const loc = active.requestLocation || {};

  return (
    <div className="customer-page">
      <header className="customer-header">
        <p className="eyebrow">Active job</p>
        <h1>{active.issue}</h1>
        <p className="hero-copy">
          {active.garageName} ·{" "}
          <span className={`status-badge status-${active.status}`}>{STATUS_LABEL[active.status]}</span>
        </p>
      </header>

      <JobStatusTimeline status={active.status} />

      {active.status === "pending" && (
        <div className="status-info-banner">
          <strong>Garage is reviewing your request</strong>
          <p>They will assign a mechanic shortly. You will see tracking once staff is on the way.</p>
        </div>
      )}

      {TRACKING.includes(active.status) && (
        <div className="tracking-banner">
          <span className="pulse-dot" />
          <div>
            <strong>{active.assignedStaffName || "Mechanic"} is heading to you</strong>
            <p>Live GPS on the map below</p>
          </div>
        </div>
      )}

      <div className="customer-layout single-col">
        <section className="premium-card map-panel">
          <h2>Live tracking</h2>
          <p className="panel-sub">Your location · Green = assigned mechanic</p>
          {loc.lat != null ? (
            <LiveMap
              lat={loc.lat}
              lng={loc.lng}
              label="Your breakdown"
              markers={mapMarkers}
              height="360px"
              centerType="customer"
            />
          ) : (
            <p className="panel-sub">Location unavailable</p>
          )}
        </section>
        <RequestChat requestId={String(active._id)} title={`Chat · ${active.garageName}`} />
      </div>
    </div>
  );
}
