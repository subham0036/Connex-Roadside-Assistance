const mongoose = require("mongoose");

const videoSignalSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest", required: true, index: true },
  fromUserId: { type: String, required: true },
  type: { type: String, enum: ["offer", "answer", "ice"], required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model("VideoSignal", videoSignalSchema);
