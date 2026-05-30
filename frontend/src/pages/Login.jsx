import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import { getRoleHome } from "../components/auth/ProtectedRoute";
import AuthLanding, { AuthLandingLinks } from "../components/auth/AuthLanding";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [onScreenOtp, setOnScreenOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const sendOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    setOtpHint("");
    setOnScreenOtp("");
    try {
      const res = await api.post("/api/auth/otp/send", { identifier: digits });
      setOtpSent(true);
      const code = res.data.otpForTesting ? String(res.data.otpForTesting) : "";
      if (code) {
        setOnScreenOtp(code);
        setOtp(code);
      } else {
        setOtp("");
      }
      if (res.data.smsSent) {
        setOtpHint("Check your SMS inbox for the 6-digit code.");
      } else if (code) {
        setOtpHint("SMS is not active yet — use the code below (also printed in the backend terminal).");
      } else {
        setOtpHint("Could not send SMS. Check backend terminal for your code or set CONNEX_OTP_IN_RESPONSE=true.");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Could not send OTP.");
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(-10);
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/otp/verify", {
        identifier: digits,
        otp: otp.trim(),
      });
      finishLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid OTP.");
    }
    setLoading(false);
  };

  const loginWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { email: email.trim(), password });
      finishLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid email or password.");
    }
    setLoading(false);
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setOtpSent(false);
    setOtp("");
    setOtpHint("");
    setOnScreenOtp("");
  };

  return (
    <AuthLanding
      title="Roadside help, on demand"
      subtitle="Broken down? Book a nearby garage, pay a visit fee, and track your mechanic — like ride-hailing, for repairs."
      footer={<AuthLandingLinks />}
    >
      <h2 className="auth-panel-title">Sign in</h2>

      <div className="login-mode-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "phone"}
          className={mode === "phone" ? "active" : ""}
          onClick={() => switchMode("phone")}
        >
          Mobile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "email"}
          className={mode === "email" ? "active" : ""}
          onClick={() => switchMode("email")}
        >
          Email
        </button>
      </div>

      {mode === "phone" && !otpSent && (
        <form className="login-pro-form" onSubmit={sendOtp}>
          <label className="login-pro-label">Mobile number</label>
          <div className="phone-input-row">
            <span className="phone-prefix">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="9876543210"
              autoComplete="tel"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="login-pro-error">{error}</p>}
          <button type="submit" className="login-pro-cta" disabled={loading || phone.length < 10}>
            {loading ? "Sending…" : "Continue"}
          </button>
        </form>
      )}

      {mode === "phone" && otpSent && (
        <form className="login-pro-form" onSubmit={verifyOtp}>
          <p className="login-pro-otp-sent">
            Code for <strong>+91 {phone.replace(/\D/g, "").slice(-10)}</strong>
          </p>
          {otpHint && <p className="login-pro-hint">{otpHint}</p>}
          {onScreenOtp && (
            <div className="otp-on-screen" role="status">
              <span className="otp-on-screen-label">Your login code</span>
              <strong className="otp-on-screen-code">{onScreenOtp}</strong>
              <button
                type="button"
                className="login-pro-link"
                onClick={() => {
                  navigator.clipboard?.writeText(onScreenOtp);
                  setOtpHint("Code copied. Paste it below if needed.");
                }}
              >
                Copy code
              </button>
            </div>
          )}
          <label className="login-pro-label">6-digit code</label>
          <input
            className="otp-input-single"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="• • • • • •"
            autoComplete="one-time-code"
            required
            disabled={loading}
          />
          {error && <p className="login-pro-error">{error}</p>}
          <button type="submit" className="login-pro-cta" disabled={loading || otp.length < 6}>
            {loading ? "Verifying…" : "Sign in"}
          </button>
          <button type="button" className="login-pro-link" disabled={loading} onClick={sendOtp}>
            Resend code
          </button>
          <button
            type="button"
            className="login-pro-link"
            onClick={() => {
              setOtpSent(false);
              setError("");
              setOtpHint("");
              setOnScreenOtp("");
              setOtp("");
            }}
          >
            Change number
          </button>
        </form>
      )}

      {mode === "email" && (
        <form className="login-pro-form" onSubmit={loginWithEmail}>
          <label className="login-pro-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@garage.com"
            autoComplete="email"
            required
            disabled={loading}
          />
          <label className="login-pro-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
              <p className="login-pro-hint">Garage owners & field mechanics use email + password.</p>
          {error && <p className="login-pro-error">{error}</p>}
          <button type="submit" className="login-pro-cta" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      <p className="staff-login-promo">
        Field mechanic?{" "}
        <Link to="/staff/login">Open staff sign-in</Link>
        {" "}— use the email & password from your garage owner.
      </p>
    </AuthLanding>
  );
}
