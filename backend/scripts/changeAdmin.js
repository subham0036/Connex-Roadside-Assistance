/**
 * Change Admin Credentials
 * Usage: node scripts/changeAdmin.js newEmail newPassword
 * Example: node scripts/changeAdmin.js admin@mycompany.com NewSecurePass123!
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function changeAdmin(newEmail, newPassword) {
  if (!newEmail || !newPassword) {
    console.error("❌ Usage: node scripts/changeAdmin.js <newEmail> <newPassword>");
    console.error("Example: node scripts/changeAdmin.js admin@mycompany.com NewPass123!");
    process.exit(1);
  }

  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/connex";
    await mongoose.connect(uri);
    console.log("✓ Connected to MongoDB");

    // Find existing admin
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.error("❌ No admin found. Run: node scripts/seedAdmin.js");
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(newPassword, salt);

    // Update admin
    admin.email = newEmail;
    admin.password = hashedPass;
    await admin.save();

    console.log("✅ Admin updated successfully!");
    console.log(`   Email: ${newEmail}`);
    console.log(`   Password: ${newPassword} (hashed & saved)`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

const [email, password] = process.argv.slice(2);
changeAdmin(email, password);
