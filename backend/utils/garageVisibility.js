/** Garages shown on customer search / booking */
exports.customerVisibleGarageFilter = () => ({
  isApproved: true,
  moderationStatus: { $nin: ["paused", "suspended"] },
});

exports.isGarageVisibleToCustomers = (garage) => {
  if (!garage) return false;
  if (!garage.isApproved) return false;
  const status = garage.moderationStatus || "active";
  return status !== "paused" && status !== "suspended";
};

exports.moderationLabel = (status) => {
  switch (status) {
    case "paused":
      return "Paused";
    case "suspended":
      return "Suspended";
    case "active":
    default:
      return "Active";
  }
};
