import { Link } from "react-router-dom";
import "./CompletionModal.css";

export default function CompletionModal({ job, onClose }) {
  if (!job) return null;

  const total = (job.fixedFee || 0) + (job.repairAmount || 0);

  return (
    <div className="completion-overlay" role="dialog" aria-labelledby="completion-title">
      <div className="completion-modal premium-card">
        <div className="completion-icon">✓</div>
        <h2 id="completion-title">Repair completed</h2>
        <p className="completion-lead">
          <strong>{job.assignedStaffName || "Your mechanic"}</strong> marked this job done at{" "}
          {job.garageName}.
        </p>
        <ul className="completion-details">
          <li>{job.issue}</li>
          <li>Total paid: ₹{total}</li>
        </ul>
        <p className="panel-sub">You can rate your experience and view the receipt in order history.</p>
        <div className="completion-actions">
          <Link to="/customer/completed" className="btn-primary" onClick={onClose}>
            View completed orders
          </Link>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
