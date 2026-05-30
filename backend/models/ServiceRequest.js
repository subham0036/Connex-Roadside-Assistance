const mongoose = require("mongoose");

const COMMISSION_RATE = 0.06;

const serviceRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    garageId: { type: mongoose.Schema.Types.ObjectId, ref: "Garage", required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    garageName: String,
    customerName: String,
    issue: { type: String, required: true },
    vehicleType: { type: String, required: true },
    phone: { type: String, required: true },
    requestLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    fixedFee: { type: Number, required: true },
    fixedFeePaid: { type: Boolean, default: false },
    fixedFeePaymentMethod: {
      type: String,
      enum: ["UPI", "Cash", "Card"],
      default: "UPI",
    },
    repairAmount: { type: Number, default: 0 },
    repairPaymentMethod: { type: String, enum: ["UPI", "Cash", "Card"] },
    platformCommission: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Cash", "Card"],
      default: "UPI",
    },
    assignedStaffName: String,
    note: String,
    status: {
      type: String,
      enum: ["pending", "assigned", "en_route", "arrived", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

serviceRequestSchema.statics.calcCommission = (fixedFee, repairAmount = 0) => {
  const total = Number(fixedFee) + Number(repairAmount || 0);
  return Number((total * COMMISSION_RATE).toFixed(2));
};

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
