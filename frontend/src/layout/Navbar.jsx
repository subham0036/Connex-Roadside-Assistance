import { useState } from "react";
import ConnexLogo from "../components/brand/ConnexLogo";
import ProfilePanel from "../components/profile/ProfilePanel";
import "../style/Navbar.css";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const role = localStorage.getItem("connex_role");
  const user = JSON.parse(localStorage.getItem("connex_user") || "{}");
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <div className="navbar">
        <ConnexLogo size={36} className="connex-logo--navbar" />
        <div className="nav-actions">
          <span className="nav-tag">24/7 Roadside Assistance</span>
          <button
            type="button"
            className="nav-avatar"
            onClick={() => setProfileOpen(true)}
            title="My profile"
          >
            <span className="nav-avatar-circle">{initials(user.name)}</span>
            <span className="nav-avatar-name">{user.name || "Profile"}</span>
          </button>
          <span className="nav-role-badge">{role}</span>
        </div>
      </div>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
