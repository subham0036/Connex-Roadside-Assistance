const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["customer", "mechanic", "staff", "admin"],
    default: "customer",
  },
  phone: String,
  address: String,
  age: { type: Number, min: 18, max: 80 },
  garageId: { type: mongoose.Schema.Types.ObjectId, ref: "Garage" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
