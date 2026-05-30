import { useEffect, useRef, useState } from "react";
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
  const userId = String(JSON.parse(localStorage.getItem("connex_user") || "{}").id || "");

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
        <div>
          <strong>Connex video</strong>
          <p className="panel-sub">{status} · In-app only, no external apps</p>
        </div>
        <button type="button" className="video-close" onClick={endCall}>
          End call
        </button>
      </div>
      {error && <p className="connex-video-error">{error}</p>}
      <div className="connex-video-grid">
        <div className="connex-video-tile remote">
          <span className="video-label">Remote</span>
          <video ref={remoteRef} autoPlay playsInline />
        </div>
        <div className="connex-video-tile local">
          <span className="video-label">You</span>
          <video ref={localRef} autoPlay playsInline muted />
        </div>
      </div>
    </div>,
    document.body
  );
}
