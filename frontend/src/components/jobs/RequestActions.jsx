import { useState } from "react";
import api from "../../config/api";
import { getApiError } from "../../utils/apiError";
import "./RequestActions.css";

export function GarageRequestActions({ request, onUpdated, compact = false }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const canAccept = request.status === "pending" && !request.garageAccepted && !request.staffId;
  const canDecline =
    (request.status === "pending" && !request.staffId) ||
    (request.status === "assigned" && request.staffId && request.staffAccepted !== true);

  if (!canAccept && !canDecline) return null;

  const accept = async (e) => {
    e?.stopPropagation?.();
    setLoading("accept");
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/accept`, {});
      onUpdated?.(res.data?.request);
    } catch (err) {
      setError(getApiError(err, "Could not accept request."));
    }
    setLoading("");
  };

  const reject = async (e) => {
    e?.stopPropagation?.();
    if (!window.confirm("Decline this customer request? They will be notified.")) return;
    setLoading("reject");
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/reject`, {});
      onUpdated?.(res.data?.request);
    } catch (err) {
      setError(getApiError(err, "Could not decline request."));
    }
    setLoading("");
  };

  return (
    <div className={`request-actions ${compact ? "request-actions--compact" : ""}`} onClick={(e) => e.stopPropagation()}>
      {canAccept && (
        <button type="button" className="btn-primary" disabled={!!loading} onClick={accept}>
          {loading === "accept" ? "Accepting…" : "Accept request"}
        </button>
      )}
      {canDecline && (
        <button type="button" className="btn-decline" disabled={!!loading} onClick={reject}>
          {loading === "reject" ? "Declining…" : "Decline"}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function StaffAssignmentActions({ request, onUpdated }) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const needsResponse =
    request.status === "assigned" && request.staffId && request.staffAccepted === false;

  if (!needsResponse) return null;

  const accept = async () => {
    setLoading("accept");
    setError("");
    try {
      const res = await api.post(`/api/requests/${request._id}/staff-accept`, {});
      onUpdated?.(res.data?.request);
    } catch (err) {
      setError(getApiError(err, "Could not accept job."));
    }
    setLoading("");
  };

  const decline = async () => {
    if (!window.confirm("Decline this job? Your garage owner can assign someone else.")) return;
    setLoading("decline");
    setError("");
    try {
      await api.post(`/api/requests/${request._id}/staff-decline`, {});
      onUpdated?.(null);
    } catch (err) {
      setError(getApiError(err, "Could not decline job."));
    }
    setLoading("");
  };

  return (
    <div className="staff-assignment-banner">
      <div>
        <strong>New job assignment</strong>
        <p className="panel-sub">Accept to start navigation, or decline if you cannot take this job.</p>
      </div>
      <div className="request-actions">
        <button type="button" className="btn-primary" disabled={!!loading} onClick={accept}>
          {loading === "accept" ? "Accepting…" : "Accept job"}
        </button>
        <button type="button" className="btn-decline" disabled={!!loading} onClick={decline}>
          {loading === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function CustomerCancelRequest({ request, onCancelled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canCancel =
    request.status === "pending" ||
    (request.status === "assigned" && request.staffAccepted !== true);

  if (!canCancel) return null;

  const cancel = async () => {
    if (!window.confirm("Cancel this booking? Visit fee refund depends on garage policy.")) return;
    setLoading(true);
    setError("");
    try {
      await api.post(`/api/requests/${request._id}/cancel`, {});
      onCancelled?.();
    } catch (err) {
      setError(getApiError(err, "Could not cancel request."));
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
