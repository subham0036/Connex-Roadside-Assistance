import React, { useEffect, useState } from "react";
import api from "../../config/api";
import "./AdminDashboard.css";

const TABS = ["overview", "staff", "customers", "garages", "requests"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [garages, setGarages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, garagesRes, requestsRes, staffRes, customersRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/garages"),
        api.get("/api/admin/requests"),
        api.get("/api/admin/staff"),
        api.get("/api/admin/customers"),
      ]);
      setStats(statsRes.data);
      setGarages(garagesRes.data);
      setRequests(requestsRes.data);
      setStaff(staffRes.data);
      setCustomers(customersRes.data);
    } catch {
      setStats(null);
    }
    setLoading(false);
  };

  const toggleApproval = async (id, current) => {
    await api.patch(`/api/admin/garages/${id}/approval`, { isApproved: !current });
    loadAll();
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p className="panel-sub">Loading...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="page-head">
        <span className="eyebrow">Platform admin</span>
        <h2 className="page-title">Connex overview</h2>
        <p className="hero-copy">Staff, customers, garages, and service history with locations.</p>
      </header>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? "admin-tab active" : "admin-tab"}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {(tab === "overview" || tab === "garages") && (
        <>
          {tab === "overview" && (
            <div className="stats-grid">
              {[
                { label: "Customers", value: stats?.customers },
                { label: "Garages", value: stats?.garages },
                { label: "Staff", value: stats?.staff },
                { label: "Commission", value: `₹${stats?.totalCommission ?? 0}`, highlight: true },
                { label: "Total jobs", value: stats?.totalRequests },
                { label: "Completed", value: stats?.completedJobs },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`premium-card stat-card ${item.highlight ? "premium-card--highlight" : ""}`}
                >
                  <h3>{item.label}</h3>
                  <p className="stat-value">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {(tab === "overview" || tab === "garages") && (
            <section className="premium-card admin-section">
              <h3>Garage partners</h3>
              {garages.map((g) => (
                <div key={g._id} className="admin-row">
                  <div>
                    <strong>{g.shopName}</strong>
                    <p className="panel-sub">
                      {g.address} · ₹{g.fixedFee} visit fee
                      {g.location?.lat != null && (
                        <>
                          {" "}
                          · {g.location.lat.toFixed(4)}, {g.location.lng.toFixed(4)}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={g.isApproved ? "btn-secondary" : "btn-primary"}
                    onClick={() => toggleApproval(g._id, g.isApproved)}
                  >
                    {g.isApproved ? "Suspend" : "Approve"}
                  </button>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {tab === "staff" && (
        <section className="premium-card admin-section">
          <h3>All staff & garage owners</h3>
          {staff.length === 0 && <p className="panel-sub">No staff registered yet.</p>}
          {staff.map((s) => (
            <div key={s._id} className="admin-row admin-row--stack">
              <div>
                <strong>{s.name}</strong>
                <p className="panel-sub">
                  {s.email} · {s.phone || "—"} · {s.isActive ? "Active" : "Inactive"}
                </p>
                {s.garage ? (
                  <p className="admin-meta">
                    Garage: <strong>{s.garage.shopName}</strong> · Owner: {s.garage.ownerName} (
                    {s.garage.ownerEmail}, {s.garage.ownerPhone || "—"})
                  </p>
                ) : (
                  <p className="admin-meta">No garage linked</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "customers" && (
        <section className="premium-card admin-section">
          <h3>Customers & service history</h3>
          {customers.length === 0 && <p className="panel-sub">No customers yet.</p>}
          {customers.map((c) => (
            <div key={c._id} className="admin-customer-block">
              <button
                type="button"
                className="admin-customer-head"
                onClick={() => setExpandedCustomer(expandedCustomer === c._id ? null : c._id)}
              >
                <div>
                  <strong>{c.name}</strong>
                  <p className="panel-sub">
                    {c.email} · {c.phone || "—"} · {c.address || "No address"}
                  </p>
                  <p className="admin-meta">
                    {c.totalJobs} jobs · {c.completedJobs} completed
                  </p>
                </div>
                <span>{expandedCustomer === c._id ? "−" : "+"}</span>
              </button>
              {expandedCustomer === c._id && (
                <ul className="admin-service-list">
                  {c.services.length === 0 && <li className="panel-sub">No service requests yet.</li>}
                  {c.services.map((j) => (
                    <li key={j.requestId}>
                      <strong>{j.issue}</strong> · {j.vehicleType} · {j.status}
                      <br />
                      <span className="panel-sub">
                        Garage: {j.garageName || "—"} · Staff: {j.staffName || "—"} · ₹
                        {(j.fixedFee || 0) + (j.repairAmount || 0)}
                      </span>
                      {j.location?.lat != null && (
                        <span className="admin-loc">
                          GPS: {j.location.lat.toFixed(5)}, {j.location.lng.toFixed(5)}
                          {j.location.note ? ` · ${j.location.note}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(tab === "overview" || tab === "requests") && (
        <section className="premium-card admin-section">
          <h3>{tab === "overview" ? "Recent requests" : "All service requests"}</h3>
          {(tab === "overview" ? requests.slice(0, 20) : requests).map((r) => (
            <div key={r._id} className="admin-row admin-row--stack">
              <div>
                <strong>{r.issue}</strong>
                <p className="panel-sub">
                  Customer: {r.customerId?.name} ({r.customerId?.phone}) · Garage:{" "}
                  {r.garageId?.shopName || r.garageName} · Staff: {r.staffId?.name || "—"}
                </p>
                <p className="panel-sub">
                  ₹{(r.fixedFee || 0) + (r.repairAmount || 0)} · {r.vehicleType}
                </p>
                {r.requestLocation?.lat != null && (
                  <p className="admin-loc">
                    Breakdown: {r.requestLocation.lat.toFixed(5)}, {r.requestLocation.lng.toFixed(5)}
                    {r.requestLocation.note ? ` · ${r.requestLocation.note}` : ""}
                  </p>
                )}
              </div>
              <span className={`status-badge status-${r.status}`}>{r.status}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
