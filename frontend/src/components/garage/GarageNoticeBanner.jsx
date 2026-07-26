import api from "../../config/api";
import "./GarageNoticeBanner.css";

const NOTICE_TITLES = {
  warning: "Official warning from Connex admin",
  pause: "Garage paused — hidden from customers",
  suspend: "Garage suspended",
  activate: "Garage reactivated",
};

export default function GarageNoticeBanner({ garage, onDismiss }) {
  if (!garage) return null;

  const status = garage.moderationStatus || (garage.isApproved ? "active" : "suspended");
  const unread = (garage.adminNotices || []).filter((n) => !n.readAt);
  const latest = garage.latestNotice || unread[unread.length - 1];

  if (!latest && status === "active") return null;

  const title =
    latest?.type && NOTICE_TITLES[latest.type]
      ? NOTICE_TITLES[latest.type]
      : status === "paused"
        ? "Your garage is paused"
        : status === "suspended"
          ? "Your garage is suspended"
          : "Notice from Connex admin";

  const tone =
    status === "suspended" || latest?.type === "suspend"
      ? "danger"
      : status === "paused" || latest?.type === "pause"
        ? "warn"
        : latest?.type === "warning"
          ? "warning"
          : "info";

  const dismiss = async () => {
    try {
      await api.post("/api/garages/mine/notices/read");
      onDismiss?.();
    } catch {
      onDismiss?.();
    }
  };

  return (
    <div className={`garage-notice-banner garage-notice-banner--${tone}`} role="alert">
      <div>
        <strong>{title}</strong>
        {latest?.message && <p>{latest.message}</p>}
        {status === "paused" && (
          <p className="garage-notice-sub">
            Customers cannot find your garage until admin reactivates your listing.
          </p>
        )}
        {status === "suspended" && (
          <p className="garage-notice-sub">
            New bookings are blocked. Finish existing jobs or contact Connex admin.
          </p>
        )}
      </div>
      {(unread.length > 0 || latest) && (
        <button type="button" className="btn-secondary" onClick={dismiss}>
          Got it
        </button>
      )}
    </div>
  );
}
