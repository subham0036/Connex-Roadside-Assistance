import { useCallback, useEffect, useRef, useState } from "react";
import api from "../config/api";

const CALL_TYPES = new Set(["invite", "accept", "decline", "cancel"]);
const INVITE_TTL_MS = 45000;

function getUserId() {
  try {
    return String(JSON.parse(localStorage.getItem("connex_user") || "{}").id || "");
  } catch {
    return "";
  }
}

function getCallerInfo() {
  try {
    const user = JSON.parse(localStorage.getItem("connex_user") || "{}");
    return {
      callerName: user.name || "User",
      callerRole: localStorage.getItem("connex_role") || "user",
    };
  } catch {
    return { callerName: "User", callerRole: "user" };
  }
}

function playRing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* optional */
  }
}

export function useVideoCallInvite(requestId, { enabled = true, onIncoming } = {}) {
  const userId = getUserId();
  const [callState, setCallState] = useState("idle");
  const [incomingFrom, setIncomingFrom] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [notice, setNotice] = useState("");
  const sinceRef = useRef(new Date().toISOString());
  const callStateRef = useRef("idle");
  const handledRef = useRef(new Set());

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const postSignal = useCallback(
    async (type, payload = {}) => {
      if (!requestId) return;
      await api.post(`/api/chat/${requestId}/video/signal`, { type, payload });
    },
    [requestId]
  );

  const startCall = useCallback(async () => {
    if (!requestId) return;
    setNotice("");
    handledRef.current.clear();
    sinceRef.current = new Date().toISOString();
    await postSignal("invite", getCallerInfo());
    setCallState("outgoing");
  }, [requestId, postSignal]);

  const acceptCall = useCallback(async () => {
    if (!requestId) return;
    await postSignal("accept", {});
    setIncomingFrom(null);
    setCallState("accepted");
    setShowVideo(true);
  }, [requestId, postSignal]);

  const declineCall = useCallback(async () => {
    if (!requestId) return;
    await postSignal("decline", {});
    setIncomingFrom(null);
    setCallState("idle");
  }, [requestId, postSignal]);

  const cancelCall = useCallback(async () => {
    if (!requestId) return;
    await postSignal("cancel", {});
    setCallState("idle");
    setNotice("");
  }, [requestId, postSignal]);

  const endVideo = useCallback(() => {
    setShowVideo(false);
    setCallState("idle");
    setNotice("");
    handledRef.current.clear();
    sinceRef.current = new Date().toISOString();
  }, []);

  useEffect(() => {
    if (!requestId || !enabled || !userId) return undefined;

    const poll = async () => {
      try {
        const res = await api.get(
          `/api/chat/${requestId}/video/signals?since=${encodeURIComponent(sinceRef.current)}`
        );
        const signals = (res.data || []).filter((sig) => CALL_TYPES.has(sig.type));
        if (!signals.length) return;

        sinceRef.current = signals[signals.length - 1].createdAt;

        for (const sig of signals) {
          const key = String(sig._id);
          if (handledRef.current.has(key)) continue;
          if (String(sig.fromUserId) === userId) continue;

          handledRef.current.add(key);
          const state = callStateRef.current;
          const age = Date.now() - new Date(sig.createdAt).getTime();

          if (sig.type === "invite" && state === "idle" && age < INVITE_TTL_MS) {
            setIncomingFrom(sig.payload || {});
            setCallState("incoming");
            playRing();
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("Incoming Connex video call", {
                body: `${sig.payload?.callerName || "Someone"} is calling…`,
              });
            }
            onIncoming?.(sig.payload);
          }

          if (sig.type === "accept" && state === "outgoing") {
            setCallState("accepted");
            setShowVideo(true);
            setNotice("");
          }

          if (sig.type === "decline" && state === "outgoing") {
            setCallState("idle");
            setNotice("Call declined.");
          }

          if (sig.type === "cancel" && state === "incoming") {
            setIncomingFrom(null);
            setCallState("idle");
            setNotice("Caller cancelled.");
          }
        }
      } catch {
        /* polling */
      }
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [requestId, enabled, userId, onIncoming]);

  return {
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
  };
}

export function useIncomingVideoCalls(requestIds) {
  const userId = getUserId();
  const [incoming, setIncoming] = useState(null);
  const sinceMapRef = useRef({});
  const handledRef = useRef(new Set());

  useEffect(() => {
    const ids = (requestIds || []).map(String).filter(Boolean);
    if (!ids.length || !userId) {
      setIncoming(null);
      return undefined;
    }

    ids.forEach((id) => {
      if (!sinceMapRef.current[id]) {
        sinceMapRef.current[id] = new Date().toISOString();
      }
    });

    const poll = async () => {
      for (const requestId of ids) {
        try {
          const since = sinceMapRef.current[requestId] || new Date(0).toISOString();
          const res = await api.get(
            `/api/chat/${requestId}/video/signals?since=${encodeURIComponent(since)}`
          );
          const signals = (res.data || []).filter((s) => s.type === "invite");
          if (!signals.length) continue;

          sinceMapRef.current[requestId] = signals[signals.length - 1].createdAt;

          for (const sig of signals) {
            const key = String(sig._id);
            if (handledRef.current.has(key)) continue;
            if (String(sig.fromUserId) === userId) continue;

            const age = Date.now() - new Date(sig.createdAt).getTime();
            if (age >= INVITE_TTL_MS) continue;

            handledRef.current.add(key);
            playRing();
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("Incoming Connex video call", {
                body: `${sig.payload?.callerName || "Someone"} is calling…`,
              });
            }
            setIncoming({ requestId, from: sig.payload || {} });
            return;
          }
        } catch {
          /* polling */
        }
      }
    };

    poll();
    const timer = setInterval(poll, 2500);
    return () => clearInterval(timer);
  }, [requestIds, userId]);

  const dismiss = useCallback(() => setIncoming(null), []);

  return { incoming, dismiss };
}
