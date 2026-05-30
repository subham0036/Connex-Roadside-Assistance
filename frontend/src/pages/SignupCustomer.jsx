import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import AuthLanding, { AuthLandingLinks } from "../components/auth/AuthLanding";
import "./Login.css";

export default function SignupCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/api/auth/signup/customer", {
        ...form,
        role: "customer",
      });
      localStorage.setItem("connex_token", response.data.token);
      localStorage.setItem("connex_role", "customer");
      localStorage.setItem("connex_user", JSON.stringify(response.data.user || {}));
      navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLanding
      title="Get back on the road"
      subtitle="Create a free account, report a breakdown, and book a trusted garage near you in minutes."
      features={[
        "Sign in later with your mobile OTP",
        "See live mechanic tracking",
        "Pay visit fee only when you book",
      ]}
      footer={<AuthLandingLinks customerTo="/signup/customer" />}
    >
      <h2 className="auth-panel-title">Create account</h2>
      <p className="auth-panel-sub">For vehicle owners · use your real mobile for OTP login</p>

      <form className="login-pro-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Full name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>Mobile (OTP login)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(-10) })}
            placeholder="10-digit number"
            required
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>City / area</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            disabled={loading}
          />
        </div>
        {error && <p className="login-pro-error">{error}</p>}
        <button type="submit" className="login-pro-cta" disabled={loading}>
          {loading ? "Creating…" : "Get started"}
        </button>
      </form>
      <p className="auth-panel-foot">
        Have an account? <Link to="/login">Sign in with mobile OTP</Link> — use the same number you entered above.
      </p>
    </AuthLanding>
  );
}
