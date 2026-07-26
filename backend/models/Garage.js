const mongoose = require("mongoose");

const garageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    fixedFee: { type: Number, required: true, default: 249 },
    rating: { type: Number, default: 4.8 },
    isApproved: { type: Boolean, default: true },
    moderationStatus: {
      type: String,
      enum: ["active", "paused", "suspended"],
      default: "active",
    },
    adminNotices: [
      {
        type: {
          type: String,
          enum: ["warning", "pause", "suspend", "activate"],
          required: true,
        },
        message: { type: String, required: true },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        issuedAt: { type: Date, default: Date.now },
        readAt: Date,
      },
    ],
    lastModerationAt: Date,
    location: {
      lat: Number,
      lng: Number,
    },
    services: {
      type: [String],
      default: ["Tyre Repair", "Battery Jump", "Engine Repair", "Fuel Delivery"],
    },
    upiId: { type: String, trim: true },
    upiQrCode: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Garage", garageSchema);
