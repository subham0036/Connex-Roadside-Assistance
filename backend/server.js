const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });
const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());
app.use(morgan("tiny"));
connectDB();

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/garages", require("./routes/garageRoutes"));
app.use("/api/staff", require("./routes/staffRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "Connex backend" }));

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`✓ Server running on http://localhost:${port}`);
  console.log(`✓ MongoDB: ${process.env.MONGO_URI ? "Configured" : "Not set"}`);
  console.log(`✓ JWT Secret: ${process.env.JWT_SECRET ? "Configured" : "Using default"}`);
  const sms = process.env.FAST2SMS_API_KEY ? "Fast2SMS key set" : "no SMS key";
  const otpScreen = process.env.CONNEX_OTP_IN_RESPONSE === "true" ? "OTP shown on login when SMS fails" : "OTP in API only if SMS fails (dev)";
  console.log(`✓ OTP: ${sms} · ${otpScreen}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`✗ Port ${port} is already in use. On macOS, port 5000 is often taken by AirPlay Receiver — set PORT=5001 in .env`);
  } else {
    console.error("✗ Server failed to start:", err.message);
  }
  process.exit(1);
});