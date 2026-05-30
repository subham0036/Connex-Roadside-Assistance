const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shopName: String,
    phone: String,
    location: String,
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mechanic", mechanicSchema);