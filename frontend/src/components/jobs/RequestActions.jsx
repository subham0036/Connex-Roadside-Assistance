import { useState } from "react";
import api from "../../config/api";
import "./RequestActions.css";

export function GarageRequestActions({ request, onUpdated, compact = false }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  if (request.status !== "pending" || request.garageAccepted) return null;

  const accept = async (e) => {
    e?.stopPropagation?.();
    setLoading("accept");
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/accept`);
      onUpdated?.(res.data?.request);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not accept request.");
    }
    setLoading("");
  };

  const reject = async (e) => {
    e?.stopPropagation?.();
    if (!window.confirm("Decline this customer request? They will be notified.")) return;
    setLoading("reject");
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/reject`);
      onUpdated?.(res.data?.request);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not decline request.");
    }
    setLoading("");
  };

  return (
    <div className={`request-actions ${compact ? "request-actions--compact" : ""}`} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="btn-primary" disabled={!!loading} onClick={accept}>
        {loading === "accept" ? "Accepting…" : "Accept request"}
      </button>
      <button type="button" className="btn-decline" disabled={!!loading} onClick={reject}>
        {loading === "reject" ? "Declining…" : "Decline"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function CustomerCancelRequest({ request, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCancel = ["pending", "assigned"].includes(request.status);

  if (!canCancel) return null;

  const cancel = async () => {
    if (!window.confirm("Cancel this booking? Visit fee refund depends on garage policy.")) return;
    setLoading(true);
    setError("");
    try {
      await api.post(`/api/requests/${request._id}/cancel`);
      onCancelled?.();
    } catch (err) {
      setError(err.response?.data?.msg || "Could not cancel request.");
    }
    setLoading(false);
  };

  return (
    <div className="customer-cancel-request">
      <button type="button" className="btn-decline" disabled={loading} onClick={cancel}>
        {loading ? "Cancelling…" : "Cancel request"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
