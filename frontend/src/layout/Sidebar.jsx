import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../config/api";
import ConnexLogo from "../components/brand/ConnexLogo";
import "../style/Sidebar.css";

import {
  ClipboardList,
  Wrench,
  Users,
  MapPinned,
  History,
  LayoutDashboard,
  LogOut,
  PlusCircle,
} from "lucide-react";

const ROLE_LINKS = {
  mechanic: [
    {
      to: "/garage",
      label: "Requests",
      icon: <ClipboardList size={22} />,
    },
    {
      to: "/garage/staff",
      label: "Staff",
      icon: <Users size={22} />,
    },
    {
      to: "/garage/setup",
      label: "Garage",
      icon: <Wrench size={22} />,
    },
  ],

  staff: [
    {
      to: "/staff",
      label: "My Job",
      icon: <MapPinned size={22} />,
    },
  ],

  admin: [
    {
      to: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard size={22} />,
    },
  ],
};

export default function Sidebar() {
  const role = localStorage.getItem("connex_role");

  const [completedCount, setCompletedCount] = useState(0);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (role !== "customer") return;

    api
      .get("/api/requests/mine")
      .then((res) => {
        const list = res.data || [];

        setCompletedCount(
          list.filter((r) => r.status === "completed").length
        );

        setHasActive(
          list.some(
            (r) =>
              !["completed", "cancelled"].includes(r.status)
          )
        );
      })
      .catch(() => {});
  }, [role]);

  let links = ROLE_LINKS[role] || [];

  if (role === "customer") {
    links = [
      {
        to: "/customer",
        label: "Request",
        icon: <PlusCircle size={22} />,
        end: true,
      },
      {
        to: "/customer/active",
        label: "Active",
        icon: <MapPinned size={22} />,
        badge: hasActive ? "LIVE" : null,
      },
      {
        to: "/customer/completed",
        label: "History",
        icon: <History size={22} />,
        badge: completedCount || null,
      },
    ];
  }

  const logout = () => {
    localStorage.removeItem("connex_token");
    localStorage.removeItem("connex_role");
    localStorage.removeItem("connex_user");
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-brand">
        <ConnexLogo
          size={36}
          showWordmark={false}
          className="sidebar-logo"
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-links">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span className="sidebar-icon">
              {link.icon}
            </span>

            <span className="sidebar-text">
              {link.label}
            </span>

            {link.badge && (
              <span className="sidebar-badge">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        type="button"
        className="sidebar-exit-btn"
        onClick={logout}
        title="Sign out"
      >
        <span className="sidebar-icon">
          <LogOut size={22} />
        </span>
        <span className="sidebar-text">Sign out</span>
      </button>
    </aside>
  );
}