import "./JobFlowGuide.css";

const FLOW = [
  { who: "Customer", action: "Books & pays visit fee" },
  { who: "You", action: "Assign staff" },
  { who: "Staff", action: "Navigate → Arrive → Complete" },
  { who: "You & Customer", action: "Get completion alert" },
];

export default function JobFlowGuide() {
  return (
    <section className="job-flow-guide premium-card">
      <h3>How a job runs</h3>
      <ol className="job-flow-list">
        {FLOW.map((step, i) => (
          <li key={step.action}>
            <span className="job-flow-num">{i + 1}</span>
            <div>
              <strong>{step.who}</strong>
              <p>{step.action}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="panel-sub">
        When staff taps <strong>Complete job</strong>, you see a popup here and the customer sees completion in{" "}
        <strong>Active job</strong> then <strong>Completed</strong> in their sidebar.
      </p>
    </section>
  );
}
