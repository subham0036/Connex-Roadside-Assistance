import { Navigate } from "react-router-dom";

const ROLE_HOME = {
  customer: "/customer",
  mechanic: "/garage",
  staff: "/staff",
  admin: "/admin",
};

export function getRoleHome(role) {
  return ROLE_HOME[role] || "/login";
}

export default function ProtectedRoute({ children, allowedRoles, loginPath = "/login" }) {
  const token = localStorage.getItem("connex_token");
  const role = localStorage.getItem("connex_role");

  if (!token) return <Navigate to={loginPath} replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    const home = getRoleHome(role);
    const redirect = role === "staff" ? "/staff/login" : home;
    return <Navigate to={redirect} replace />;
  }

  return children;
}
