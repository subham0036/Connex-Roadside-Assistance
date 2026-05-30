const mongoose = require("mongoose");

const staffLocationSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", required: true, unique: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("StaffLocation", staffLocationSchema);
