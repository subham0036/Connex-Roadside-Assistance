import "./JobStatusTimeline.css";

const STEPS = [
  { key: "pending", label: "Request sent" },
  { key: "assigned", label: "Staff assigned" },
  { key: "en_route", label: "On the way" },
  { key: "arrived", label: "At location" },
  { key: "completed", label: "Completed" },
];

const ORDER = STEPS.map((s) => s.key);

function stepIndex(status) {
  if (status === "cancelled") return -1;
  const i = ORDER.indexOf(status);
  return i >= 0 ? i : 0;
}

export default function JobStatusTimeline({ status, compact = false }) {
  const current = stepIndex(status);
  const cancelled = status === "cancelled";

  return (
    <div className={`job-timeline ${compact ? "job-timeline--compact" : ""}`}>
      {cancelled ? (
        <p className="job-timeline-cancelled">Request cancelled</p>
      ) : (
        STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const upcoming = i > current;
          return (
            <div
              key={step.key}
              className={`job-timeline-step ${done ? "done" : ""} ${active ? "active" : ""} ${upcoming ? "upcoming" : ""}`}
            >
              <div className="job-timeline-dot" />
              <span className="job-timeline-label">{step.label}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
