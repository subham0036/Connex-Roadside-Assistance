const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { signup, login, getMe, sendOtp, verifyOtp, firebaseLogin, sendEmailOtp, verifyEmailOtp } = require("../controllers/authController");

router.post("/signup/customer", (req, res, next) => {
  req.signupRole = "customer";
  next();
}, signup);

router.post("/signup/mechanic", (req, res, next) => {
  req.signupRole = "mechanic";
  next();
}, signup);

router.post("/login", login);
router.post("/firebase-login", firebaseLogin);
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);
router.post("/email-otp/send", sendEmailOtp);
router.post("/email-otp/verify", verifyEmailOtp);
router.get("/me", auth, getMe);

module.exports = router;
