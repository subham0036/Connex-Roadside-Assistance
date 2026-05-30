import axios from "axios";

export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

const AUTH_PATHS = ["/api/auth/login", "/api/auth/otp/send", "/api/auth/otp/verify", "/api/auth/signup"];

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("connex_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || "";
    const isAuthCall = AUTH_PATHS.some((p) => url.includes(p));
    const onPublicAuthPage =
      window.location.pathname === "/login" ||
      window.location.pathname.startsWith("/signup") ||
      window.location.pathname === "/staff/login";

    if (status === 401 && !isAuthCall && !onPublicAuthPage) {
      const role = localStorage.getItem("connex_role");
      localStorage.removeItem("connex_token");
      localStorage.removeItem("connex_role");
      localStorage.removeItem("connex_user");
      window.location.href = role === "staff" ? "/staff/login" : "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
