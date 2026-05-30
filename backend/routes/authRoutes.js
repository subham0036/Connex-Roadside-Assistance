const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { signup, login, getMe, sendOtp, verifyOtp } = require("../controllers/authController");

router.post("/signup/customer", (req, res, next) => {
  req.signupRole = "customer";
  next();
}, signup);

router.post("/signup/mechanic", (req, res, next) => {
  req.signupRole = "mechanic";
  next();
}, signup);

router.post("/login", login);
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.get("/me", auth, getMe);

module.exports = router;
