import { formatPaymentMethod, paymentSummaryLines } from "../../utils/requestPayments";
import "./PaymentSummary.css";

export default function PaymentSummary({ request, highlight = false }) {
  const p = paymentSummaryLines(request);

  return (
    <div className={`payment-summary ${highlight ? "payment-summary--highlight" : ""}`}>
      <h4>Customer payments (full record)</h4>
      <div className="payment-summary-row">
        <span>Visit fee (paid when booking)</span>
        <strong>₹{p.visit}</strong>
        <span className="payment-method-tag">{formatPaymentMethod(p.visitMethod)}</span>
      </div>
      <div className="payment-summary-row">
        <span>On-site repair (staff reported)</span>
        <strong>₹{p.repair}</strong>
        {request.status === "completed" ? (
          <span className="payment-method-tag">{formatPaymentMethod(p.repairMethod)}</span>
        ) : (
          <span className="payment-method-tag pending">After job</span>
        )}
      </div>
      <div className="payment-summary-total">
        <span>Total from customer</span>
        <strong>₹{p.total}</strong>
      </div>
      {request.status === "completed" && (
        <p className="payment-summary-note">
          Connex commission ₹{p.commission.toFixed(2)} · Your garage keeps ₹{p.garageNet.toFixed(2)}
        </p>
      )}
      {request.status !== "completed" && p.repair === 0 && (
        <p className="payment-summary-note">On-site amount is added when staff completes the job.</p>
      )}
    </div>
  );
}
