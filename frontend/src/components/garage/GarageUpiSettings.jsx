import { useEffect, useState } from "react";
import api from "../../config/api";
import { readQrImageFile } from "../../utils/upiPayment";
import "../payment/UpiPaymentPanel.css";
import "./GarageUpiSettings.css";

export default function GarageUpiSettings({ garage, onSaved, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [upiId, setUpiId] = useState("");
  const [upiQrPreview, setUpiQrPreview] = useState("");
  const [removeUpiQr, setRemoveUpiQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!garage) return;
    setUpiId(garage.upiId || "");
    setUpiQrPreview(garage.upiQrCode || "");
    setRemoveUpiQr(false);
    if (!garage.upiId && !garage.upiQrCode) {
      setOpen(true);
    }
  }, [garage]);

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await readQrImageFile(file);
      setUpiQrPreview(dataUrl);
      setRemoveUpiQr(false);
    } catch (err) {
      setError(err.message || "Could not upload QR code.");
    }
    e.target.value = "";
  };

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await api.put("/api/garages/mine", {
        upiId: upiId.trim(),
        upiQrCode: upiQrPreview || undefined,
        removeUpiQr: removeUpiQr && !upiQrPreview,
      });
      setMessage("Payment details saved. Customers will see these when they pay by UPI.");
      onSaved?.(res.data?.garage);
    } catch (err) {
      setError(err.response?.data?.msg || "Could not save payment details.");
    }
    setLoading(false);
  };

  const hasPayment = Boolean(garage?.upiId || garage?.upiQrCode);

  return (
    <section className={`premium-card garage-upi-settings ${hasPayment ? "" : "garage-upi-settings--missing"}`}>
      <button type="button" className="garage-upi-toggle" onClick={() => setOpen((v) => !v)}>
        <div>
          <h3>UPI & QR payments</h3>
          <p className="panel-sub">
            {hasPayment
              ? `Saved · ${garage.upiId || "QR only"}`
              : "Add UPI ID and QR code so customers can pay the visit fee"}
          </p>
        </div>
        <span className="garage-upi-chevron">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <form className="garage-upi-form" onSubmit={save}>
          <label>UPI ID</label>
          <input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourshop@paytm or 9876543210@ybl"
          />

          <label>Upload UPI QR code</label>
          <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleQrUpload} />
          <p className="section-copy">GPay / PhonePe QR image (PNG or JPG, max 400 KB).</p>

          {upiQrPreview && (
            <div className="upi-setup-actions">
              <img src={upiQrPreview} alt="UPI QR preview" className="upi-setup-preview" />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setUpiQrPreview("");
                  setRemoveUpiQr(true);
                }}
              >
                Remove QR
              </button>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="toast-success">{message}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving…" : "Save payment details"}
          </button>
        </form>
      )}
    </section>
  );
}
