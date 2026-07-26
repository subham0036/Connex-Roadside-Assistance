import { useEffect, useState } from "react";
import api from "../../config/api";
import { copyText } from "../../utils/upiPayment";
import "./UpiPaymentPanel.css";

export default function UpiPaymentPanel({ garageId, amount, shopName }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!garageId) return undefined;
    setLoading(true);
    setError("");
    api
      .get(`/api/garages/${garageId}/payment`)
      .then((res) => setPayment(res.data))
      .catch(() => setError("Could not load UPI payment details."))
      .finally(() => setLoading(false));
  }, [garageId]);

  const handleCopy = async () => {
    const ok = await copyText(payment?.upiId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <p className="panel-sub upi-panel-loading">Loading payment details…</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  const hasUpi = payment?.upiId || payment?.upiQrCode;

  if (!hasUpi) {
    return (
      <div className="upi-payment-panel upi-payment-panel--empty">
        <p className="panel-sub">
          {shopName} has not added a UPI ID or QR code yet. Pay cash on arrival or contact the garage.
        </p>
      </div>
    );
  }

  return (
    <div className="upi-payment-panel">
      <h3>Pay ₹{amount} via UPI</h3>
      <p className="panel-sub">Scan the QR or copy the UPI ID, pay the visit fee, then confirm below.</p>

      {payment.upiQrCode && (
        <div className="upi-qr-wrap">
          <img src={payment.upiQrCode} alt={`${shopName} UPI QR code`} className="upi-qr-image" />
          <span className="upi-qr-caption">Scan with GPay, PhonePe, or Paytm</span>
        </div>
      )}

      {payment.upiId && (
        <div className="upi-id-row">
          <div>
            <span className="upi-id-label">UPI ID</span>
            <strong className="upi-id-value">{payment.upiId}</strong>
          </div>
          <button type="button" className="btn-secondary" onClick={handleCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
