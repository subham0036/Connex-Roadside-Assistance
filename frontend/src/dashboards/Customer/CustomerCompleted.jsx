import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import "./CustomerDashboard.css";

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomerCompleted() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      api
        .get("/api/requests/mine")
        .then((res) => {
          setCompleted((res.data || []).filter((r) => r.status === "completed"));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="customer-page">
      <header className="customer-header">
        <p className="eyebrow">Order history</p>
        <h1>Completed repairs</h1>
        <p className="hero-copy">
          Jobs marked <strong>Complete</strong> by your mechanic appear here automatically.
        </p>
      </header>

      {loading ? (
        <p className="panel-sub">Loading...</p>
      ) : completed.length === 0 ? (
        <div className="premium-card empty-state-card">
          <h2>No completed orders yet</h2>
          <p className="panel-sub">
            When staff finishes on-site, you get a popup on Active job and the receipt shows here.
          </p>
          <Link to="/customer" className="btn-primary">
            New request
          </Link>
        </div>
      ) : (
        <div className="completed-list">
          {completed.map((req) => (
            <div key={req._id} className="premium-card completed-card">
              <div className="completed-head">
                <strong>{req.issue}</strong>
                <span className="status-badge status-completed">Completed</span>
              </div>
              <p>{req.garageName}</p>
              <p className="panel-sub">
                Visit ₹{req.fixedFee}
                {req.repairAmount ? ` + on-site repair ₹${req.repairAmount}` : ""}
                {" · "}
                <strong>Total ₹{(req.fixedFee || 0) + (req.repairAmount || 0)}</strong>
              </p>
              {req.assignedStaffName && (
                <p className="panel-sub">Mechanic: {req.assignedStaffName}</p>
              )}
              <p className="completed-date">Completed {formatDate(req.updatedAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
