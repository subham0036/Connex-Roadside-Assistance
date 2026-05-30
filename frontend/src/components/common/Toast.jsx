import "./Toast.css";

export default function Toast({ alert, onDismiss }) {
  if (!alert) return null;

  return (
    <div className="connex-toast" role="alert">
      <div className="connex-toast-body">
        <strong>{alert.title}</strong>
        <p>{alert.body}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
