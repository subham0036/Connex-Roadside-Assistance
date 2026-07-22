import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import { formatPaymentMethod } from "../../utils/requestPayments";
import "./StaffHistory.css";

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

function currentStaffId() {
  try {
    const raw = localStorage.getItem("connex_user");
    if (!raw) return null;
    return JSON.parse(raw)?._id || null;
  } catch {
    return null;
  }
}

export default function StaffHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const staffId = currentStaffId();

  useEffect(() => {
    const load = () => {
      api
        .get("/api/requests/mine")
        .then((res) => {
          setJobs(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const { completed, declined } = useMemo(() => {
    const completedList = jobs.filter((j) => j.status === "completed");
    const declinedList = [];

    jobs.forEach((job) => {
      (job.staffHistory || []).forEach((entry) => {
        if (entry.outcome !== "declined") return;
        const entryStaffId = entry.staffId?._id || entry.staffId;
        if (staffId && String(entryStaffId) !== String(staffId)) return;
        declinedList.push({
          key: `${job._id}-${entry.at}`,
          job,
          at: entry.at,
        });
      });
    });

    declinedList.sort((a, b) => new Date(b.at) - new Date(a.at));
    completedList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return { completed: completedList, declined: declinedList };
  }, [jobs, staffId]);

  const totalCount = completed.length + declined.length;

  return (
    <div className="page-container staff-history">
      <header className="page-head">
        <p className="eyebrow">Work history</p>
        <h1 className="page-title">Your completed & declined jobs</h1>
        <p className="hero-copy">
          Every job you finish or decline is saved here so you can review past work.
        </p>
      </header>

      {loading ? (
        <p className="panel-sub">Loading…</p>
      ) : totalCount === 0 ? (
        <div className="premium-card empty-state-card">
          <h2>No work history yet</h2>
          <p className="panel-sub">
            Completed repairs and declined assignments will appear here automatically.
          </p>
          <Link to="/staff" className="btn-primary">
            Back to my job
          </Link>
        </div>
      ) : (
        <>
          {completed.length > 0 && (
            <section className="history-section">
              <h2 className="history-section-title">Completed ({completed.length})</h2>
              <div className="history-list">
                {completed.map((req) => (
                  <div key={req._id} className="premium-card history-card">
                    <div className="history-card-head">
                      <strong>{req.issue}</strong>
                      <span className="status-badge status-completed">Completed</span>
                    </div>
                    <p>{req.garageName}</p>
                    <p className="panel-sub">
                      {req.vehicleType} · {req.customerName || req.customerId?.name}
                    </p>
                    <p className="panel-sub">
                      Visit ₹{req.fixedFee}
                      {req.repairAmount ? ` + repair ₹${req.repairAmount}` : ""}
                      {" · "}
                      <strong>Total ₹{(req.fixedFee || 0) + (req.repairAmount || 0)}</strong>
                    </p>
                    {req.repairPaymentMethod && (
                      <p className="panel-sub">
                        On-site payment: {formatPaymentMethod(req.repairPaymentMethod)}
                      </p>
                    )}
                    <p className="history-date">Completed {formatDate(req.updatedAt)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {declined.length > 0 && (
            <section className="history-section">
              <h2 className="history-section-title">Declined ({declined.length})</h2>
              <div className="history-list">
                {declined.map(({ key, job, at }) => (
                  <div key={key} className="premium-card history-card history-card--declined">
                    <div className="history-card-head">
                      <strong>{job.issue}</strong>
                      <span className="status-badge status-cancelled">Declined</span>
                    </div>
                    <p>{job.garageName}</p>
                    <p className="panel-sub">
                      {job.vehicleType} · {job.customerName || job.customerId?.name}
                    </p>
                    <p className="history-date">Declined {formatDate(at)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
