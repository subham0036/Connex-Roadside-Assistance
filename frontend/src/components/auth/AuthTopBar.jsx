import { Link } from "react-router-dom";
import ConnexLogo from "../brand/ConnexLogo";
import "./AuthTopBar.css";

export default function AuthTopBar({ active }) {
  return (
    <header className="auth-top-bar">
      <Link to="/login" className="auth-top-logo-link">
        <ConnexLogo size={32} />
      </Link>
      <div className="auth-profile-links">
        <Link
          to="/signup/customer"
          className={`profile-circle ${active === "customer" ? "active" : ""}`}
          title="Customer"
        >
          C
        </Link>
        <Link
          to="/signup/mechanic"
          className={`profile-circle ${active === "garage" ? "active" : ""}`}
          title="Garage owner"
        >
          G
        </Link>
        <Link to="/login" className={`profile-circle ${active === "login" ? "active" : ""}`} title="Sign in">
          ↵
        </Link>
      </div>
    </header>
  );
}
