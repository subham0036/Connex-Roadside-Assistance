const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normalizeIdentifier, userFilterFromIdentifier } = require("../utils/identifier");
const { sendOtpSms } = require("../utils/sms");
const { sendOtpEmail } = require("../utils/email");
const { normalizePhone10 } = require("../utils/phone");

function shouldExposeOtpInResponse(smsSent) {
  if (process.env.CONNEX_OTP_IN_RESPONSE === "true") return true;
  if (!smsSent) return true;
  return process.env.NODE_ENV !== "production";
}

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
});

const createToken = (user) => {
  const secret = process.env.JWT_SECRET || "connex_super_secret_key_2024";
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn: "7d" }
  );
};

// Signup — role is set by route, not client body
exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const role = req.signupRole || "customer";

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required." });
    }

    const phone10 = normalizePhone10(phone);
    if (role === "customer" && !phone10) {
      return res.status(400).json({ msg: "A valid 10-digit mobile number is required for OTP login." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "Email already used!" });

    if (phone10) {
      const phoneTaken = await User.findOne({
        $or: [{ phone: phone10 }, { phone: `+91${phone10}` }, { phone: `91${phone10}` }],
      });
      if (phoneTaken) {
        return res.status(400).json({ msg: "This mobile number is already registered." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPass,
      role,
      phone: phone10 || phone,
      address,
    });

    const token = createToken(user);
    res.status(201).json({
      msg: "Signup successful!",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Signup failed", error: err.message });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "User not found!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Wrong password!" });

    const token = createToken(user);
    res.status(200).json({
      msg: "Login successful!",
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Login failed", error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    const normalized = normalizeIdentifier(identifier);
    if (!normalized) {
      return res.status(400).json({ msg: "Enter a valid 10-digit mobile number." });
    }
    if (normalized.type === "email") {
      return res.status(400).json({ msg: "Email accounts sign in with password." });
    }

    let user = await User.findOne(userFilterFromIdentifier(normalized));
    if (!user) {
      return res.status(404).json({
        msg: "No account for this mobile. Sign up first at Create account, using the same number.",
      });
    }
    if (user.role !== "customer") {
      return res.status(400).json({
        msg: "Garage owners and staff sign in with email and password — use the Email tab.",
      });
    }

    const phone10 = normalizePhone10(user.phone) || normalized.value;
    if (user.phone !== phone10) {
      user.phone = phone10;
      await user.save();
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = `${normalized.type}:${normalized.value}`;
    await Otp.deleteMany({ identifier: key });
    await Otp.create({
      identifier: key,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const sms = await sendOtpSms(phone10, code);
    const payload = {
      msg: sms.sent
        ? "OTP sent to your mobile number."
        : "SMS could not be delivered. Use the code shown below to sign in.",
      smsSent: sms.sent,
    };
    if (shouldExposeOtpInResponse(sms.sent)) {
      payload.otpForTesting = code;
      payload.showOtpOnScreen = true;
    }
    res.json(payload);
  } catch (err) {
    res.status(500).json({ msg: "Could not send OTP.", error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const normalized = normalizeIdentifier(identifier);
    if (!normalized || !otp) {
      return res.status(400).json({ msg: "Identifier and OTP are required." });
    }

    const key = `${normalized.type}:${normalized.value}`;
    const entered = String(otp).replace(/\D/g, "").trim();
    if (entered.length !== 6) {
      return res.status(400).json({ msg: "Enter the full 6-digit code." });
    }

    const record = await Otp.findOne({ identifier: key }).sort({ createdAt: -1 });
    if (!record || record.code !== entered) {
      return res.status(400).json({ msg: "Invalid OTP. Tap Resend code and try the latest code." });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ msg: "OTP expired. Request a new one." });
    }

    const user = await User.findOne(userFilterFromIdentifier(normalized));
    if (!user) return res.status(404).json({ msg: "Account not found." });
    if (user.role !== "customer") {
      return res.status(400).json({
        msg: "Garage owners and staff sign in with email and password — use the Email tab.",
      });
    }

    await Otp.deleteMany({ identifier: key });

    const token = createToken(user);
    res.json({
      msg: "Login successful!",
      token,
      role: user.role,
      user: userPayload(user),
    });
  } catch (err) {
    res.status(500).json({ msg: "OTP verification failed.", error: err.message });
  }
};

// Firebase Phone Auth Login
exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken, phone } = req.body;
    
    if (!idToken || !phone) {
      return res.status(400).json({ msg: "Firebase ID token and phone number are required." });
    }

    const phone10 = normalizePhone10(phone);
    if (!phone10) {
      return res.status(400).json({ msg: "Invalid phone number from Firebase." });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { phone: phone10 },
        { phone: `+91${phone10}` },
        { phone: `91${phone10}` },
      ],
    });

    if (!user) {
      // First time login — create customer account
      user = await User.create({
        name: `Customer ${phone10.slice(-4)}`,
        email: `customer_${phone10}@connex.local`,
        password: "firebase_phone_auth",
        phone: phone10,
        role: "customer",
        address: "",
      });
      console.log(`[Firebase Auth] Created new customer: ${phone10}`);
    } else if (user.role !== "customer") {
      return res.status(400).json({
        msg: "Phone number registered as garage owner or staff. Use email + password on Email tab.",
      });
    }

    const token = createToken(user);
    res.json({
      msg: "Login successful!",
      token,
      role: user.role,
      user: userPayload(user),
    });
  } catch (err) {
    console.error("[Firebase Auth Error]", err);
    res.status(500).json({ msg: "Firebase login failed.", error: err.message });
  }
};

// Email OTP - Send
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes("@")) {
      return res.status(400).json({ msg: "Valid email is required." });
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const key = `email:${email.toLowerCase()}`;

    // Delete old OTPs for this email
    await Otp.deleteMany({ identifier: key });

    // Create new OTP (expires in 5 minutes)
    await Otp.create({
      identifier: key,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send email
    const emailResult = await sendOtpEmail(email, code);

    if (emailResult.sent) {
      res.json({
        msg: "✓ OTP sent to " + email,
        success: true,
      });
    } else {
      res.json({
        msg: "Could not send email. Try again in a moment.",
        success: false,
        otpForTesting: code, // For development
      });
    }
  } catch (err) {
    console.error("[Send Email OTP Error]", err);
    res.status(500).json({ msg: "Could not send OTP.", error: err.message });
  }
};

// Email OTP - Verify
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required." });
    }

    const entered = String(otp).replace(/\D/g, "").trim();
    if (entered.length !== 6) {
      return res.status(400).json({ msg: "Enter the full 6-digit code." });
    }

    const key = `email:${email.toLowerCase()}`;
    const record = await Otp.findOne({ identifier: key }).sort({ createdAt: -1 });

    if (!record || record.code !== entered) {
      return res.status(400).json({ msg: "Invalid OTP. Check your email or request a new one." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ msg: "OTP expired. Request a new one." });
    }

    // Find or create user (for email-based accounts)
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // First time login via email — create customer account
      const name = email.split("@")[0];
      user = await User.create({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: email.toLowerCase(),
        password: "email_otp_auth_" + Date.now(), // Dummy password
        phone: "",
        role: "customer",
        address: "",
      });
      console.log(`[Email OTP] Created new customer: ${email}`);
    }

    // Delete OTP after verification
    await Otp.deleteMany({ identifier: key });

    const token = createToken(user);
    res.json({
      msg: "✓ Login successful!",
      token,
      role: user.role,
      user: userPayload(user),
    });
  } catch (err) {
    console.error("[Verify Email OTP Error]", err);
    res.status(500).json({ msg: "OTP verification failed.", error: err.message });
  }
};