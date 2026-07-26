const MAX_QR_LENGTH = 600_000;

exports.normalizeUpiId = (value) => {
  if (value == null || value === "") return "";
  return String(value).trim().toLowerCase();
};

exports.validateUpiQrCode = (value) => {
  if (value == null || value === "") return { ok: true, value: "" };
  const qr = String(value);
  if (!qr.startsWith("data:image/")) {
    return { ok: false, msg: "QR code must be a PNG or JPG image." };
  }
  if (qr.length > MAX_QR_LENGTH) {
    return { ok: false, msg: "QR image is too large. Use a file under 400 KB." };
  }
  return { ok: true, value: qr };
};

exports.applyPaymentFields = (garage, body) => {
  if (body.upiId !== undefined) {
    garage.upiId = exports.normalizeUpiId(body.upiId);
  }
  if (body.upiQrCode !== undefined) {
    const check = exports.validateUpiQrCode(body.upiQrCode);
    if (!check.ok) return check;
    garage.upiQrCode = check.value;
  }
  if (body.removeUpiQr === true) {
    garage.upiQrCode = "";
  }
  return { ok: true };
};

exports.publicPaymentPayload = (garage) => ({
  garageId: garage._id,
  shopName: garage.shopName,
  upiId: garage.upiId || "",
  upiQrCode: garage.upiQrCode || "",
  hasUpiQr: Boolean(garage.upiQrCode),
});
