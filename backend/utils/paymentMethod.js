const PAYMENT_METHODS = ["UPI", "Cash", "Card"];

const ALIASES = {
  upi: "UPI",
  gpay: "UPI",
  paytm: "UPI",
  phonepe: "UPI",
  qr: "UPI",
  scan: "UPI",
  cash: "Cash",
  card: "Card",
  debit: "Card",
  credit: "Card",
};

function normalizePaymentMethod(raw, fallback = "UPI") {
  if (raw == null || raw === "") return fallback;
  const key = String(raw).trim();
  if (PAYMENT_METHODS.includes(key)) return key;
  const alias = ALIASES[key.toLowerCase()];
  if (alias) return alias;
  return null;
}

function isValidPaymentMethod(raw) {
  return normalizePaymentMethod(raw, null) != null;
}

module.exports = { PAYMENT_METHODS, normalizePaymentMethod, isValidPaymentMethod };
