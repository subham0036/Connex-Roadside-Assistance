export function requestTotalPaid(req) {
  return (Number(req?.fixedFee) || 0) + (Number(req?.repairAmount) || 0);
}

export function formatPaymentMethod(method) {
  const map = {
    UPI: "UPI / QR scan",
    Cash: "Cash",
    Card: "Card",
  };
  return map[method] || method || "—";
}

export function paymentSummaryLines(req) {
  const visit = Number(req?.fixedFee) || 0;
  const repair = Number(req?.repairAmount) || 0;
  const total = visit + repair;
  return {
    visit,
    repair,
    total,
    visitMethod: req?.fixedFeePaymentMethod || req?.paymentMethod,
    repairMethod: req?.repairPaymentMethod,
    commission: Number(req?.platformCommission) || 0,
    garageNet: total - (Number(req?.platformCommission) || 0),
  };
}
