const User = require("../models/User");
const Garage = require("../models/Garage");
const ServiceRequest = require("../models/ServiceRequest");
const { sendGarageNoticeEmail } = require("../utils/email");
const { moderationLabel } = require("../utils/garageVisibility");

exports.getStats = async (req, res) => {
  try {
    const [customers, garages, staff, requests, completed] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Garage.countDocuments({ isApproved: true, moderationStatus: { $nin: ["paused", "suspended"] } }),
      User.countDocuments({ role: "staff", isActive: true }),
      ServiceRequest.countDocuments(),
      ServiceRequest.find({ status: "completed" }),
    ]);

    const totalCommission = completed.reduce((sum, r) => sum + (r.platformCommission || 0), 0);
    const totalRevenue = completed.reduce(
      (sum, r) => sum + (r.fixedFee || 0) + (r.repairAmount || 0),
      0
    );

    res.json({
      customers,
      garages,
      staff,
      totalRequests: requests,
      completedJobs: completed.length,
      totalCommission: Number(totalCommission.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      commissionRate: "6%",
    });
  } catch (err) {
    res.status(500).json({ msg: "Could not load stats.", error: err.message });
  }
};

exports.getAllGarages = async (req, res) => {
  try {
    const garages = await Garage.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone");
    res.json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setGarageApproval = async (req, res) => {
  try {
    const { isApproved } = req.body;
    const approved = Boolean(isApproved);
    const garage = await Garage.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: approved,
        moderationStatus: approved ? "active" : "suspended",
        lastModerationAt: new Date(),
      },
      { new: true }
    );
    if (!garage) return res.status(404).json({ msg: "Garage not found." });
    res.json({ msg: approved ? "Garage approved." : "Garage suspended.", garage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moderateGarage = async (req, res) => {
  try {
    const { action, message } = req.body || {};
    const allowed = ["warning", "pause", "suspend", "activate"];
    if (!allowed.includes(action)) {
      return res.status(400).json({ msg: "Choose warning, pause, suspend, or activate." });
    }
    if (!message?.trim()) {
      return res.status(400).json({ msg: "Write a message for the garage owner." });
    }

    const garage = await Garage.findById(req.params.id).populate("userId", "name email");
    if (!garage) return res.status(404).json({ msg: "Garage not found." });

    const notice = {
      type: action,
      message: message.trim(),
      issuedBy: req.user.id,
      issuedAt: new Date(),
    };

    if (action === "warning") {
      garage.moderationStatus = garage.moderationStatus === "suspended" ? "suspended" : "active";
      garage.isApproved = garage.moderationStatus !== "suspended";
    } else if (action === "pause") {
      garage.moderationStatus = "paused";
      garage.isApproved = true;
    } else if (action === "suspend") {
      garage.moderationStatus = "suspended";
      garage.isApproved = false;
    } else if (action === "activate") {
      garage.moderationStatus = "active";
      garage.isApproved = true;
    }

    garage.adminNotices = garage.adminNotices || [];
    garage.adminNotices.push(notice);
    garage.lastModerationAt = new Date();
    await garage.save();

    const ownerEmail = garage.userId?.email;
    let emailResult = { sent: false };
    if (ownerEmail) {
      emailResult = await sendGarageNoticeEmail(ownerEmail, garage.shopName, action, notice.message);
    }

    const actionLabels = {
      warning: "Warning sent to garage owner.",
      pause: "Garage paused — hidden from customer search.",
      suspend: "Garage suspended.",
      activate: "Garage reactivated.",
    };

    res.json({
      msg: actionLabels[action],
      garage,
      emailSent: emailResult.sent,
      statusLabel: moderationLabel(garage.moderationStatus),
    });
  } catch (err) {
    res.status(500).json({ msg: "Could not update garage.", error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find()
      .sort({ createdAt: -1 })
      .populate("customerId", "name email phone address")
      .populate("garageId", "shopName address phone location")
      .populate("staffId", "name phone email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staffList = await User.find({ role: "staff" })
      .select("-password")
      .populate({
        path: "garageId",
        select: "shopName address phone fixedFee location",
        populate: { path: "userId", select: "name email phone" },
      })
      .sort({ createdAt: -1 });

    const result = staffList.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      isActive: s.isActive,
      garage: s.garageId
        ? {
            shopName: s.garageId.shopName,
            address: s.garageId.address,
            ownerName: s.garageId.userId?.name,
            ownerEmail: s.garageId.userId?.email,
            ownerPhone: s.garageId.userId?.phone,
          }
        : null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 });

    const requests = await ServiceRequest.find()
      .populate("garageId", "shopName")
      .populate("staffId", "name")
      .sort({ createdAt: -1 });

    const byCustomer = customers.map((c) => {
      const jobs = requests.filter((r) => r.customerId?.toString() === c._id.toString());
      return {
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        totalJobs: jobs.length,
        completedJobs: jobs.filter((j) => j.status === "completed").length,
        services: jobs.map((j) => ({
          requestId: j._id,
          issue: j.issue,
          vehicleType: j.vehicleType,
          status: j.status,
          garageName: j.garageName || j.garageId?.shopName,
          staffName: j.assignedStaffName || j.staffId?.name,
          phone: j.phone,
          fixedFee: j.fixedFee,
          repairAmount: j.repairAmount,
          location: j.requestLocation,
          createdAt: j.createdAt,
        })),
      };
    });

    res.json(byCustomer);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
