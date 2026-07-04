import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import { getRoleHome } from "../components/auth/ProtectedRoute";
import AuthLanding, { AuthLandingLinks } from "../components/auth/AuthLanding";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finishLogin = (data) => {
    const { token, role, user } = data;

    localStorage.setItem("connex_token", token);
    localStorage.setItem("connex_role", role);
    localStorage.setItem("connex_user", JSON.stringify(user || {}));

    if (role === "mechanic") {
      api
        .get("/api/garages/mine")
        .then(() => navigate("/garage"))
        .catch(() => navigate("/garage/setup"));
    } else if (role === "staff") {
      navigate("/staff");
    } else {
      navigate(getRoleHome(role));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      finishLogin(res.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.msg ||
          "Invalid email or password."
      );
    }

    setLoading(false);
  };

  return (
    <AuthLanding
      title="Roadside help, on demand"
      subtitle="Broken down? Book a nearby garage, pay a visit fee, and track your mechanic — like ride-hailing, for repairs."
      footer={<AuthLandingLinks />}
    >
      <h2 className="auth-panel-title">Sign In</h2>

      <form className="login-pro-form" onSubmit={handleLogin}>
        <label className="login-pro-label">Email Address</label>

        <input
          type="email"
          value={email}
          placeholder="Enter your email"
          autoComplete="email"
          required
          disabled={loading}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="login-pro-label">Password</label>

        <input
          type="password"
          value={password}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={loading}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="login-pro-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="login-pro-cta"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <p className="staff-login-promo">
        Garage owner or staff?{" "}
        <Link to="/staff/login">
          Use email & password
        </Link>
      </p>
    </AuthLanding>
  );
}