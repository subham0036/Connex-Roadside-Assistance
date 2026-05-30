function normalizeIdentifier(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return { type: "email", value: trimmed.toLowerCase() };
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 10) {
    return { type: "phone", value: digits.slice(-10) };
  }
  return null;
}

function userFilterFromIdentifier(id) {
  if (id.type === "email") return { email: id.value };
  const p = id.value;
  return {
    $or: [
      { phone: p },
      { phone: `+91${p}` },
      { phone: `91${p}` },
      { phone: `0${p}` },
      { phone: { $regex: `${p}$` } },
    ],
  };
}

module.exports = { normalizeIdentifier, userFilterFromIdentifier };
