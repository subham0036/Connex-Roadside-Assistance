/**
 * Seed admin user: node scripts/seedAdmin.js
 * Default: admin@connex.in / admin123456
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dotenv").config({ path: require("path").resolve(__dirname, "../backend/.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ADMIN = {
  name: "Connex Admin",
  email: "admin@connex.in",
  password: "admin123456",
  role: "admin",
  phone: "9999999999",
};

async function seed() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/connex";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const exists = await User.findOne({ email: ADMIN.email });
  if (exists) {
    console.log("Admin already exists:", ADMIN.email);
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(ADMIN.password, salt);
    await User.create({ ...ADMIN, password: hashedPass });
    console.log("Admin created:", ADMIN.email, "/", ADMIN.password);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
