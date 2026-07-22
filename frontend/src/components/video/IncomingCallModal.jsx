import { createPortal } from "react-dom";
import "./IncomingCallModal.css";

const ROLE_LABEL = {
  customer: "Customer",
  mechanic: "Garage owner",
  staff: "Mechanic",
  admin: "Admin",
};

export default function IncomingCallModal({ caller, onAccept, onDecline }) {
  if (!caller) return null;

  const name = caller.callerName || "Someone";
  const role = ROLE_LABEL[caller.callerRole] || caller.callerRole || "Connex user";

  return createPortal(
    <div className="incoming-call-overlay" role="dialog" aria-label="Incoming video call">
      <div className="incoming-call-card">
        <p className="incoming-call-badge">Incoming video call</p>
        <h2>{name}</h2>
        <p className="panel-sub">{role} wants to connect on video</p>
        <div className="incoming-call-actions">
          <button type="button" className="call-decline" onClick={onDecline}>
            Decline
          </button>
          <button type="button" className="call-accept" onClick={onAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
