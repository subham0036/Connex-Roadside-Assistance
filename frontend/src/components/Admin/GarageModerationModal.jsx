import { useEffect, useState } from "react";
import api from "../../config/api";
import { getApiError } from "../../utils/apiError";
import "./GarageModerationModal.css";

const ACTION_META = {
  warning: {
    label: "Send warning",
    hint: "Garage stays live. Owner gets an in-app notice and email.",
    defaultMessage:
      "Official warning from Connex admin: please improve response time and service quality. Further action may follow if issues continue.",
  },
  pause: {
    label: "Pause listing",
    hint: "Hidden from customer search. Owner can still manage existing jobs.",
    defaultMessage:
      "Your garage is paused on Connex and hidden from customer search. Contact platform admin to resolve and go live again.",
  },
  suspend: {
    label: "Suspend garage",
    hint: "Full suspend — no new bookings and hidden from customers.",
    defaultMessage:
      "Your garage account is suspended on Connex. You cannot receive new customer bookings until admin reactivates your account.",
  },
  activate: {
    label: "Reactivate",
    hint: "Restore garage to active and visible on customer app.",
    defaultMessage:
      "Good news — your garage is active again on Connex. Customers can find and book you normally.",
  },
};

export default function GarageModerationModal({ garage, onClose, onDone, initialAction = "warning" }) {
  const [action, setAction] = useState(initialAction);
  const [message, setMessage] = useState(ACTION_META.warning.defaultMessage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    setAction(initialAction);
    setMessage(ACTION_META[initialAction].defaultMessage);
    setError("");
    setResult("");
  }, [initialAction, garage?._id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await api.post(`/api/admin/garages/${garage._id}/moderate`, {
        action,
        message: message.trim(),
      });
      setResult(res.data?.msg || "Done.");
      onDone?.();
    } catch (err) {
      setError(getApiError(err, "Could not send notice."));
    }
    setLoading(false);
  };

  const status = garage.moderationStatus || (garage.isApproved ? "active" : "suspended");

  return (
    <div className="moderation-overlay" role="dialog" aria-modal="true">
      <div className="moderation-modal premium-card">
        <header className="moderation-head">
          <div>
            <p className="eyebrow">Garage moderation</p>
            <h2>{garage.shopName}</h2>
            <p className="panel-sub">
              Owner: {garage.userId?.name || "—"} · {garage.userId?.email || "—"}
            </p>
            <span className={`status-badge moderation-status moderation-status--${status}`}>
              {status}
            </span>
          </div>
          <button type="button" className="moderation-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form onSubmit={submit} className="moderation-form">
          <fieldset className="moderation-actions">
            <legend>Choose action</legend>
            {Object.entries(ACTION_META).map(([key, meta]) => (
              <label key={key} className={`moderation-option ${action === key ? "active" : ""}`}>
                <input
                  type="radio"
                  name="moderation-action"
                  value={key}
                  checked={action === key}
                  onChange={() => setAction(key)}
                />
                <span>
                  <strong>{meta.label}</strong>
                  <small>{meta.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="form-field">
            <label htmlFor="moderation-message">Message to garage owner</label>
            <textarea
              id="moderation-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          {result && <p className="toast-success">{result}</p>}

          <div className="moderation-foot">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !message.trim()}>
              {loading ? "Sending…" : ACTION_META[action].label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
