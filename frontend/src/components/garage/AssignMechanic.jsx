import React, { useState } from "react";
import api from "../../config/api";

export default function AssignMechanic({ request, staff, closeAssignment, onAssigned }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeStaff = (staff || []).filter((s) => s.isActive !== false);

  const assignJob = async () => {
    if (!selected) {
      setError("Please select a staff member.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/assign`, { staffId: selected._id });
      onAssigned(res.data?.request);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not assign staff. Check staff is active and request is still pending.");
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Assign staff to this job</h2>
      <p className="section-copy">Staff will receive the customer location and contact details.</p>

      {activeStaff.length === 0 ? (
        <p className="form-error">
          No active staff. Add staff from the Staff page before assigning jobs.
        </p>
      ) : (
        activeStaff.map((member) => (
          <button
            type="button"
            key={member._id}
            className={`mechanic-card ${selected?._id === member._id ? "selected" : ""}`}
            onClick={() => {
              setSelected(member);
              setError("");
            }}
          >
            <h4>{member.name}</h4>
            <p>{member.phone || member.email}</p>
          </button>
        ))
      )}

      {error && <p className="form-error">{error}</p>}

      <button
        type="button"
        className="assign-btn"
        disabled={!selected || loading || activeStaff.length === 0}
        onClick={assignJob}
      >
        {loading ? "Assigning..." : "Confirm assignment"}
      </button>
      <button type="button" className="btn-secondary" onClick={closeAssignment}>
        Back
      </button>
    </div>
  );
}
