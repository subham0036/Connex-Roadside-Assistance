import "./ConnexLogo.css";

export default function ConnexLogo({ size = 40, showWordmark = true, className = "" }) {
  return (
    <div className={`connex-logo ${className}`} style={{ "--logo-size": `${size}px` }}>
      <div className="cx-mark" aria-hidden>
        <span className="cx-c">C</span>
        <span className="cx-x">X</span>
      </div>
      {showWordmark && <span className="connex-wordmark">CONNEX</span>}
    </div>
  );
}
