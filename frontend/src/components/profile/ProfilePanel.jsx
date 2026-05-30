import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import ConnexLogo from "../brand/ConnexLogo";
import "./ProfilePanel.css";

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const ROLE_LABEL = {
  customer: "Customer",
  mechanic: "Garage owner",
  staff: "Mechanic staff",
  admin: "Platform admin",
};

export default function ProfilePanel({ open, onClose }) {
  const navigate = useNavigate();
  const role = localStorage.getItem("connex_role");
  const [profile, setProfile] = useState(null);
  const [garage, setGarage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/auth/me");
        setProfile(res.data);
        localStorage.setItem(
          "connex_user",
          JSON.stringify({
            id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone,
            address: res.data.address,
            role: res.data.role,
          })
        );
        if (res.data.role === "mechanic") {
          try {
            const g = await api.get("/api/garages/mine");
            setGarage(g.data);
          } catch {
            setGarage(null);
          }
        }
      } catch {
        setProfile(JSON.parse(localStorage.getItem("connex_user") || "{}"));
      }
      setLoading(false);
    };
    load();
  }, [open]);

  const logout = () => {
    localStorage.removeItem("connex_token");
    localStorage.removeItem("connex_role");
    localStorage.removeItem("connex_user");
    onClose();
    navigate("/login");
  };

  if (!open) return null;

  const name = profile?.name || "User";

  return (
    <div className="profile-overlay" onClick={onClose} role="presentation">
      <div className="profile-panel premium-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="profile-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="profile-header">
          <div className="profile-avatar-lg">{initials(name)}</div>
          <div>
            <h2>{name}</h2>
            <p className="panel-sub">{ROLE_LABEL[role] || role}</p>
          </div>
        </div>

        {loading ? (
          <p className="panel-sub">Loading profile...</p>
        ) : (
          <dl className="profile-details">
            <div>
              <dt>Email</dt>
              <dd>{profile?.email || "—"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{profile?.phone || "—"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{profile?.address || "—"}</dd>
            </div>
            {garage && (
              <>
                <div className="profile-section-title">Your garage</div>
                <div>
                  <dt>Shop</dt>
                  <dd>{garage.shopName}</dd>
                </div>
                <div>
                  <dt>Shop address</dt>
                  <dd>{garage.address}</dd>
                </div>
                <div>
                  <dt>Visit fee</dt>
                  <dd>₹{garage.fixedFee}</dd>
                </div>
                {garage.location?.lat != null && (
                  <div>
                    <dt>Shop GPS</dt>
                    <dd>
                      {garage.location.lat.toFixed(5)}, {garage.location.lng.toFixed(5)}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        )}

        <div className="profile-footer">
          <ConnexLogo size={24} />
          <button type="button" className="btn-secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
