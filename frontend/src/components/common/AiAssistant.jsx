import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./AiAssistant.css";

const FAQ = [
  {
    q: "How does Connex work?",
    a: "Enter your breakdown details, find a garage within 25 km, pay the visit fee, and the garage assigns a mechanic who navigates to your GPS location.",
  },
  {
    q: "Where is the admin dashboard?",
    a: "Sign in with your registered mobile number or email — we send a 6-digit OTP (like Ola/Uber). Admins use the same flow.",
  },
  {
    q: "How does video chat work?",
    a: "On an active request, open Chat and tap Video call. You and the garage join the same room to show the vehicle damage live.",
  },
  {
    q: "How does staff tracking work?",
    a: "After the garage assigns staff, the mechanic's phone shares live GPS. You see them on the map like food delivery apps.",
  },
  {
    q: "What is the visit fee?",
    a: "A fixed amount set by each garage, paid before dispatch. It covers the trip to your breakdown location.",
  },
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const location = useLocation();

  if (["/login", "/signup/customer", "/signup/mechanic", "/"].includes(location.pathname)) {
    return null;
  }

  const ask = (e) => {
    e.preventDefault();
    const q = input.toLowerCase().trim();
    const match = FAQ.find(
      (f) =>
        (q.includes("admin") && f.q.includes("admin")) ||
        (q.includes("video") && f.q.includes("video")) ||
        (q.includes("track") && f.q.includes("tracking")) ||
        (q.includes("fee") && f.q.includes("fee")) ||
        (q.includes("work") && f.q.includes("work")) ||
        f.q.toLowerCase().includes(q.slice(0, 12))
    );
    setReply(match ? match.a : "Try asking about: how Connex works, admin dashboard, video call, staff tracking, or visit fee.");
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        className="ai-fab"
        onClick={() => setOpen(!open)}
        aria-label="Connex assistant"
      >
        AI
      </button>
      {open && (
        <div className="ai-panel premium-card">
          <div className="ai-panel-head">
            <strong>Connex Guide</strong>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <p className="panel-sub">Quick answers about the platform.</p>
          <ul className="ai-faq-list">
            {FAQ.map((f) => (
              <li key={f.q}>
                <button type="button" onClick={() => setReply(f.a)}>{f.q}</button>
              </li>
            ))}
          </ul>
          {reply && <p className="ai-reply">{reply}</p>}
          <form onSubmit={ask}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
            />
          </form>
        </div>
      )}
    </>
  );
}
