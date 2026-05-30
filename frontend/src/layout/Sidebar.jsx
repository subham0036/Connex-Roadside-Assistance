import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../config/api";
import ConnexLogo from "../components/brand/ConnexLogo";
import "../style/Sidebar.css";

const ROLE_LINKS = {
  mechanic: [
    { to: "/garage", label: "Requests" },
    { to: "/garage/staff", label: "Staff" },
    { to: "/garage/setup", label: "Garage" },
  ],
  staff: [{ to: "/staff", label: "My job & map" }],
  admin: [{ to: "/admin", label: "Admin Data" }],
};

export default function Sidebar() {
  const role = localStorage.getItem("connex_role");
  const [completedCount, setCompletedCount] = useState(0);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (role !== "customer") return;
    api.get("/api/requests/mine")
      .then((res) => {
        const list = res.data || [];
        setCompletedCount(list.filter((r) => r.status === "completed").length);
        setHasActive(list.some((r) => !["completed", "cancelled"].includes(r.status)));
      })
      .catch(() => {});
  }, [role]);

  let links = ROLE_LINKS[role] || [];

  if (role === "customer") {
    links = [
      { to: "/customer", label: "New request", end: true },
      { to: "/customer/active", label: "Active job", badge: hasActive ? "LIVE" : null },
      { to: "/customer/completed", label: "Completed", badge: completedCount || null },
    ];
  }

  return (
    <nav className="sidebar">
      <ConnexLogo size={40} className="connex-logo--sidebar" />
      <p className="sidebar-role">{role}</p>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
        >
          {link.label}
          {link.badge ? <span className="sidebar-badge">{link.badge}</span> : null}
        </NavLink>
      ))}
      {role === "admin" && (
        <p className="sidebar-hint">
          All platform data lives here — customers, garages, jobs, and commission. No need to open MongoDB for daily use.
        </p>
      )}
      {role === "mechanic" && (
        <p className="sidebar-hint">
          Assign staff from Requests. Staff sign in at /staff/login (link on Staff page).
        </p>
      )}
      {role === "staff" && (
        <p className="sidebar-hint">
          Customer map, Google Maps navigate, then mark Complete when repair is done.
        </p>
      )}
    </nav>
  );
}
