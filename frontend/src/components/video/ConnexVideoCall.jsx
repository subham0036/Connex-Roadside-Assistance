import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../../config/api";
import "./ConnexVideoCall.css";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export default function ConnexVideoCall({ requestId, onClose }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(null);
  const pollRef = useRef(null);
  const sinceRef = useRef(new Date(Date.now() - 60000).toISOString());
  const handledRef = useRef(new Set());
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Connecting...");
  const [micMuted, setMicMuted] = useState(false);
  const userId = String(JSON.parse(localStorage.getItem("connex_user") || "{}").id || "");

  const toggleMic = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    setMicMuted((prev) => {
      const next = !prev;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!requestId || !userId) return undefined;

    let cancelled = false;

    const postSignal = async (type, payload) => {
      await api.post(`/api/chat/${requestId}/video/signal`, { type, payload });
    };

    const processSignal = async (pc, sig) => {
      const key = String(sig._id);
      if (handledRef.current.has(key)) return;
      handledRef.current.add(key);

      if (String(sig.fromUserId) === userId) return;

      try {
        if (sig.type === "offer" && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await postSignal("answer", answer);
          setStatus("Connected");
        } else if (sig.type === "answer" && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          setStatus("Connected");
        } else if (sig.type === "ice" && sig.payload) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(sig.payload));
          } catch {
            /* duplicate ICE */
          }
        }
      } catch (e) {
        console.warn("Signal error", e);
      }
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: true,
        });
        if (cancelled) return;
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteRef.current && event.streams[0]) {
            remoteRef.current.srcObject = event.streams[0];
            setStatus("Live");
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            postSignal("ice", event.candidate.toJSON()).catch(() => {});
          }
        };

        const recent = await api.get(
          `/api/chat/${requestId}/video/signals?since=${encodeURIComponent(sinceRef.current)}`
        );
        const list = recent.data || [];
        const remoteOffer = list.find(
          (s) => s.type === "offer" && String(s.fromUserId) !== userId
        );

        if (remoteOffer) {
          await processSignal(pc, remoteOffer);
          for (const sig of list) {
            await processSignal(pc, sig);
          }
        } else {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await postSignal("offer", offer);
          setStatus("Waiting for other party to join...");
        }

        sinceRef.current = new Date().toISOString();

        pollRef.current = setInterval(async () => {
          try {
            const res = await api.get(
              `/api/chat/${requestId}/video/signals?since=${encodeURIComponent(sinceRef.current)}`
            );
            const signals = res.data || [];
            if (signals.length) {
              sinceRef.current = signals[signals.length - 1].createdAt;
            }
            for (const sig of signals) {
              await processSignal(pc, sig);
            }
          } catch {
            /* polling */
          }
        }, 1200);
      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Allow camera and microphone to use in-app video."
            : "Could not start video. Check permissions and try again."
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (pcRef.current) pcRef.current.close();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [requestId, userId]);

  const endCall = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (pcRef.current) pcRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    api.delete(`/api/chat/${requestId}/video/signals`).catch(() => {});
    onClose();
  };

  return createPortal(
    <div className="connex-video-overlay" role="dialog" aria-label="In-app video call">
      <div className="connex-video-bar">
        <div className="connex-video-bar-info">
          <strong>Connex video</strong>
          <p className="panel-sub">{status}</p>
        </div>
      </div>

      {error && <p className="connex-video-error">{error}</p>}

      <div className="connex-video-stage">
        <div className="connex-video-tile remote">
          <span className="video-label">Remote</span>
          <video ref={remoteRef} autoPlay playsInline />
        </div>
        <div className="connex-video-tile local">
          <span className="video-label">You</span>
          <video ref={localRef} autoPlay playsInline muted />
          {micMuted && <span className="video-muted-badge">Muted</span>}
        </div>
      </div>

      <div className="connex-video-controls">
        <button
          type="button"
          className={`video-ctrl-btn ${micMuted ? "is-active" : ""}`}
          onClick={toggleMic}
          aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={micMuted}
        >
          <span className="video-ctrl-icon" aria-hidden="true">
            {micMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V5a3 3 0 00-5.94-.6" />
                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
                <path d="M12 19v4M8 23h8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            )}
          </span>
          <span className="video-ctrl-label">{micMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button type="button" className="video-ctrl-btn video-ctrl-end" onClick={endCall}>
          <span className="video-ctrl-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </span>
          <span className="video-ctrl-label">End</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
