import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import ConnexLogo from "../components/brand/ConnexLogo";
import "./Login.css";

/** Staff portal — not linked from public customer/garage login */
export default function StaffLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email: email.trim(), password });
      if (res.data.role !== "staff") {
        setError("This portal is for field mechanics only. Use the main sign-in for customers and garage owners.");
        setLoading(false);
        return;
      }
      localStorage.setItem("connex_token", res.data.token);
      localStorage.setItem("connex_role", res.data.role);
      localStorage.setItem("connex_user", JSON.stringify(res.data.user || {}));
      navigate("/staff");
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <main className="staff-login-page">
      <div className="staff-login-card">
        <ConnexLogo size={44} />
        <p className="staff-login-badge">Field mechanic portal</p>
        <h1>Staff sign in</h1>
        <p className="panel-sub">
          Use the work email and password your garage owner gave you. Bookmark this page — you can
          return anytime. Same login is also under <strong>Sign in → Field mechanic</strong> on the
          homepage.
        </p>

        <form className="login-pro-form" onSubmit={handleSubmit}>
          <label className="login-pro-label">Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@garage.com"
            required
            disabled={loading}
          />
          <label className="login-pro-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password from garage owner"
            required
            disabled={loading}
          />
          {error && <p className="login-pro-error">{error}</p>}
          <button type="submit" className="login-pro-cta" disabled={loading}>
            {loading ? "Signing in…" : "Go to my jobs"}
          </button>
        </form>

        <p className="staff-login-note">
          Customers and garage owners use the{" "}
          <Link to="/login">main Connex sign-in</Link>.
        </p>
      </div>
    </main>
  );
}
