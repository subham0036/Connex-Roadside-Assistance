/** Last 10 digits of an Indian mobile number, or null if invalid. */
function normalizePhone10(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

module.exports = { normalizePhone10 };
