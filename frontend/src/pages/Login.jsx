import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/api";
import { getRoleHome } from "../components/auth/ProtectedRoute";
import AuthLanding, { AuthLandingLinks } from "../components/auth/AuthLanding";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpHint, setOtpHint] = useState("");
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
    
    if (!emailInput.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    
    setLoading(true);
    setError("");
    setOtpHint("");
    
    try {
      console.log("[Email OTP] Sending to", emailInput);
      
      const res = await api.post("/api/auth/email-otp/send", { email: emailInput });
      
      setEmail(emailInput);
      setOtpSent(true);
      setOtpHint(res.data.msg || "✓ OTP sent to your email");
      
      if (res.data.otpForTesting) {
        console.log("[Email OTP - Dev]", res.data.otpForTesting);
      }
    } catch (err) {
      console.error("[Email OTP Send Error]", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Could not send OTP. Try again in a moment.");
    }
    setLoading(false);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    
    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      setTimeout(() => {
        handleVerifyOtp(value);
      }, 300);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const digits = pastedText.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    
    // Auto-submit if we got 6 digits
    if (digits.length === 6) {
      setTimeout(() => {
        handleVerifyOtp(digits);
      }, 300);
    }
  };

  const handleVerifyOtp = async (otpCode) => {
    if (!otpCode || otpCode.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      console.log("[Email OTP Verify]", otpCode);
      
      const res = await api.post("/api/auth/email-otp/verify", {
        email: email,
        otp: otpCode,
      });
      
      finishLogin(res.data);
    } catch (err) {
      console.error("[Email OTP Verify Error]", err.response?.data || err.message);
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Invalid OTP. Check your email or request a new one.");
      }
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    await handleVerifyOtp(otp);
  };

  return (
    <AuthLanding
      title="Roadside help, on demand"
      subtitle="Broken down? Book a nearby garage, pay a visit fee, and track your mechanic — like ride-hailing, for repairs."
      footer={<AuthLandingLinks />}
    >
      <h2 className="auth-panel-title">Sign in with Email</h2>

      {!otpSent && (
        <form className="login-pro-form" onSubmit={sendOtp}>
          <label className="login-pro-label">Email address</label>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
            disabled={loading}
          />
          {error && <p className="login-pro-error">{error}</p>}
          <button type="submit" className="login-pro-cta" disabled={loading || !emailInput.includes("@")}>
            {loading ? "Sending OTP…" : "Send OTP"}
          </button>
        </form>
      )}

      {otpSent && (
        <form className="login-pro-form" onSubmit={verifyOtp}>
          <p className="login-pro-otp-sent">
            OTP sent to <strong>{email}</strong>
          </p>
          {otpHint && <p className="login-pro-hint">{otpHint}</p>}
          <label className="login-pro-label">6-digit code from email</label>
          <input
            className="otp-input-single"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={handleOtpChange}
            onPaste={handleOtpPaste}
            placeholder="• • • • • •"
            autoComplete="one-time-code"
            required
            disabled={loading}
            spellCheck="false"
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
              setOtp("");
            }}
          >
            Change email
          </button>
        </form>
      )}

      <p className="staff-login-promo">
        Garage owner or staff?{" "}
        <Link to="/staff/login">Use email & password</Link>
        {" "}— for garage owner accounts.
      </p>
    </AuthLanding>
  );
}
