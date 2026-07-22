import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../config/api";
import ConnexVideoCall from "../video/ConnexVideoCall";
import IncomingCallModal from "../video/IncomingCallModal";
import { useVideoCallInvite } from "../../hooks/useVideoCallInvite";
import "./RequestChat.css";

export default function RequestChat({ requestId, title, videoAutoStart = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);
  const role = localStorage.getItem("connex_role");
  const rid = requestId ? String(requestId) : null;

  const {
    callState,
    incomingFrom,
    showVideo,
    notice,
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    endVideo,
    setShowVideo,
  } = useVideoCallInvite(rid);

  const loadMessages = useCallback(async () => {
    if (!rid) return;
    try {
      const res = await api.get(`/api/chat/${rid}`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessages([]);
    }
  }, [rid]);

  useEffect(() => {
    if (!rid) return undefined;
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [rid, loadMessages]);

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!showVideo) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showVideo]);

  useEffect(() => {
    if (videoAutoStart) {
      setShowVideo(true);
    }
  }, [videoAutoStart, setShowVideo]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !rid) return;
    setLoading(true);
    setError("");
    try {
      await api.post(`/api/chat/${rid}`, { text });
      setText("");
      loadMessages();
    } catch (err) {
      setError(err.response?.data?.msg || "Could not send message.");
    }
    setLoading(false);
  };

  const handleVideoClick = async () => {
    setError("");
    try {
      await startCall();
    } catch {
      setError("Could not start video call.");
    }
  };

  if (!rid) return null;

  return (
    <div className="request-chat premium-card">
      {showVideo && <ConnexVideoCall requestId={rid} onClose={endVideo} />}

      <IncomingCallModal
        caller={callState === "incoming" ? incomingFrom : null}
        onAccept={acceptCall}
        onDecline={declineCall}
      />

      {callState === "outgoing" && (
        <div className="outgoing-call-banner">
          <div>
            <strong>Calling…</strong>
            <p className="panel-sub">Waiting for the other party to accept</p>
          </div>
          <button type="button" className="btn-secondary" onClick={cancelCall}>
            Cancel
          </button>
        </div>
      )}

      <div className="chat-head">
        <div>
          <h3>{title || "Chat with garage"}</h3>
          <p className="panel-sub">Chat in-app. Video uses your camera inside Connex — no external sites.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleVideoClick}
          disabled={callState === "outgoing" || showVideo}
        >
          Video call
        </button>
      </div>

      {notice && <p className="call-notice">{notice}</p>}

      <div className="chat-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <p className="panel-sub">No messages yet. Tell the garage what happened to your vehicle.</p>
        )}
        {messages.map((m) => (
          <div
            key={m._id}
            className={`chat-bubble ${m.senderRole === role ? "mine" : "theirs"}`}
          >
            <span className="chat-sender">{m.senderName || m.senderRole}</span>
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <form className="chat-input-row" onSubmit={send}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
