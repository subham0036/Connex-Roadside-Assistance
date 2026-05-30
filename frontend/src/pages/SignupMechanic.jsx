import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import AuthLanding, { AuthLandingLinks } from "../components/auth/AuthLanding";
import "./Login.css";

export default function SignupMechanic() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/api/auth/signup/mechanic", {
        ...form,
        role: "mechanic",
      });
      localStorage.setItem("connex_token", response.data.token);
      localStorage.setItem("connex_role", "mechanic");
      localStorage.setItem("connex_user", JSON.stringify(response.data.user || {}));
      navigate("/garage/setup");
    } catch (err) {
      setError(err.response?.data?.msg || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLanding
      title="Grow your garage"
      subtitle="List your shop on Connex, set your visit fee, assign staff, and receive paid breakdown requests."
      features={[
        "Sign in with email & password",
        "Add staff — they use a private mechanic portal",
        "Track staff live on the map",
      ]}
      footer={<AuthLandingLinks garageTo="/signup/mechanic" />}
    >
      <h2 className="auth-panel-title">Garage partner</h2>
      <p className="auth-panel-sub">Register your workshop · staff login is separate (not on this page)</p>

      <form className="login-pro-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Owner name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>Work email</label>
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
          <label>Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label>Garage address</label>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            disabled={loading}
          />
        </div>
        {error && <p className="login-pro-error">{error}</p>}
        <button type="submit" className="login-pro-cta" disabled={loading}>
          {loading ? "Registering…" : "Register garage"}
        </button>
      </form>
      <p className="auth-panel-foot">
        Already registered? <Link to="/login">Sign in with email</Link>
      </p>
    </AuthLanding>
  );
}
