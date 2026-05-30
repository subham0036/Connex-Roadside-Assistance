const ROLE_HINTS = {
  customer: "Sign in with your mobile OTP (customer account) to book help and pay the visit fee.",
  mechanic: "Garage owners should sign in with email and password on the Email tab.",
  staff: "Field staff should use Staff sign-in with email and password.",
  admin: "Admin access uses email and password.",
};

module.exports = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ msg: "Please sign in first." });
  }
  if (!roles.includes(req.user.role)) {
    const hint = ROLE_HINTS[roles[0]] || `This action needs a ${roles.join(" or ")} account.`;
    return res.status(403).json({
      msg:
        req.user.role === "mechanic" && roles.includes("customer")
          ? "Garage accounts cannot book as a customer. Sign out and use mobile OTP, or open the Garage dashboard."
          : req.user.role === "staff" && roles.includes("customer")
            ? "Staff accounts cannot book customer requests. Use Staff sign-in for assigned jobs."
            : hint,
    });
  }
  next();
};
