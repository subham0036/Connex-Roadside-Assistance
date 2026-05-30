import { Link } from "react-router-dom";
import ConnexLogo from "../brand/ConnexLogo";
import "./AuthLanding.css";

const DEFAULT_FEATURES = [
  "Book a verified garage in minutes",
  "Pay a clear visit fee upfront",
  "Track your mechanic live on the map",
];

export default function AuthLanding({
  title,
  subtitle,
  children,
  footer,
  features = DEFAULT_FEATURES,
}) {
  return (
    <div className="auth-landing">
      <section className="auth-landing-hero" aria-hidden="false">
        <ConnexLogo size={52} className="auth-hero-logo" />
        <p className="auth-landing-tag">India&apos;s roadside network</p>
        <h1>{title}</h1>
        <p className="auth-landing-lead">{subtitle}</p>
        <ul className="auth-landing-features">
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="auth-landing-foot">
          Trusted by garages and drivers across highways and cities.
        </p>
      </section>
      <section className="auth-landing-panel">
        <div className="auth-mobile-brand">
          <ConnexLogo size={44} className="auth-mobile-logo" />
          <p className="auth-mobile-tagline">CONNEX · Roadside assistance</p>
        </div>
        <div className="auth-landing-panel-inner">{children}</div>
        {footer}
      </section>
    </div>
  );
}

export function AuthLandingLinks({ customerTo, garageTo }) {
  return (
    <div className="auth-landing-links">
      <Link to={customerTo || "/signup/customer"}>New customer</Link>
      <span aria-hidden="true">·</span>
      <Link to={garageTo || "/signup/mechanic"}>Garage partner</Link>
      <span aria-hidden="true">·</span>
      <Link to="/login">Sign in</Link>
    </div>
  );
}
