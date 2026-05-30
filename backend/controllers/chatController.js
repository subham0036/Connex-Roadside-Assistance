const Message = require("../models/Message");
const VideoSignal = require("../models/VideoSignal");
const ServiceRequest = require("../models/ServiceRequest");
const Garage = require("../models/Garage");

async function canAccessChat(user, request) {
  if (user.role === "admin") return true;
  if (user.role === "customer" && request.customerId?.toString() === user.id) return true;
  if (user.role === "staff" && request.staffId?.toString() === user.id) return true;
  if (user.role === "mechanic") {
    const garage = await Garage.findById(request.garageId);
    return garage && garage.userId?.toString() === user.id;
  }
  return false;
}

exports.getMessages = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });
    if (!(await canAccessChat(req.user, request))) {
      return res.status(403).json({ msg: "No access to this chat." });
    }
    const messages = await Message.find({ requestId: request._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: "Message cannot be empty." });

    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });
    if (!(await canAccessChat(req.user, request))) {
      return res.status(403).json({ msg: "No access to this chat." });
    }

    const message = await Message.create({
      requestId: request._id,
      senderId: req.user.id,
      senderName: req.user.name || "User",
      senderRole: req.user.role,
      text: text.trim(),
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.postVideoSignal = async (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!["offer", "answer", "ice"].includes(type)) {
      return res.status(400).json({ msg: "Invalid signal type." });
    }

    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });
    if (!(await canAccessChat(req.user, request))) {
      return res.status(403).json({ msg: "No access." });
    }

    const signal = await VideoSignal.create({
      requestId: request._id,
      fromUserId: req.user.id,
      type,
      payload,
    });

    res.status(201).json(signal);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getVideoSignals = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });
    if (!(await canAccessChat(req.user, request))) {
      return res.status(403).json({ msg: "No access." });
    }

    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    const signals = await VideoSignal.find({
      requestId: request._id,
      createdAt: { $gt: since },
    })
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(signals);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.clearVideoSignals = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });
    if (!(await canAccessChat(req.user, request))) {
      return res.status(403).json({ msg: "No access." });
    }
    await VideoSignal.deleteMany({ requestId: request._id });
    res.json({ msg: "Video session cleared." });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
