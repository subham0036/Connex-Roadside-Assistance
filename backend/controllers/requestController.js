const ServiceRequest = require("../models/ServiceRequest");
const Garage = require("../models/Garage");
const User = require("../models/User");
const { getGarageForOwner, userOwnsRequestGarage } = require("../utils/garageAuth");
const { normalizePaymentMethod } = require("../utils/paymentMethod");

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

exports.createRequest = async (req, res) => {
  try {
    const { issue, vehicleType, phone, location, garageId, paymentMethod, note, fixedFeePaid } = req.body;

    if (!fixedFeePaid) {
      return res.status(400).json({ msg: "You must pay the garage visit fee before requesting help." });
    }

    if (!issue || !vehicleType || !phone) {
      return res.status(400).json({ msg: "Issue, vehicle type, and phone are required." });
    }

    const lat = Number(location?.lat);
    const lng = Number(location?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ msg: "Valid GPS location is required. Enable location and try again." });
    }

    const active = await ServiceRequest.findOne({
      customerId: req.user.id,
      status: { $nin: ["completed", "cancelled"] },
    });
    if (active) {
      return res.status(400).json({ msg: "You already have an active request. Open Active job in the sidebar." });
    }

    const garage = await Garage.findById(garageId);
    if (!garage || !garage.isApproved) {
      return res.status(404).json({ msg: "Garage not found or not approved yet." });
    }

    const visitPayment = normalizePaymentMethod(paymentMethod, "UPI");
    if (paymentMethod && !visitPayment) {
      return res.status(400).json({ msg: "Choose UPI, Cash, or Card for the visit fee." });
    }

    const fixedFee = garage.fixedFee;
    const commission = ServiceRequest.calcCommission(fixedFee, 0);
    const customer = await User.findById(req.user.id);

    const request = await ServiceRequest.create({
      customerId: req.user.id,
      customerName: customer?.name,
      garageId,
      issue,
      vehicleType,
      phone,
      requestLocation: {
        lat,
        lng,
        address: location?.address || note || "GPS location",
        note: location?.note || note,
      },
      paymentMethod: visitPayment,
      fixedFeePaymentMethod: visitPayment,
      fixedFee,
      fixedFeePaid: true,
      platformCommission: commission,
      note,
      garageName: garage.shopName,
      status: "pending",
    });

    res.status(201).json({ msg: "Request sent. Garage will assign staff shortly.", request });
  } catch (err) {
    res.status(500).json({ msg: "Could not create request.", error: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "customer") {
      filter.customerId = req.user.id;
    } else if (req.user.role === "mechanic") {
      const garages = await Garage.find({ userId: req.user.id });
      filter.garageId = { $in: garages.map((g) => g._id) };
    } else if (req.user.role === "staff") {
      filter.staffId = req.user.id;
    }

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("customerId", "name phone email")
      .populate("garageId", "shopName phone address fixedFee location")
      .populate("staffId", "name phone");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch requests.", error: err.message });
  }
};

exports.assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      return res.status(400).json({ msg: "Please select a staff member." });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: "Request not found." });

    if (request.status !== "pending") {
      return res.status(400).json({ msg: `Cannot assign staff — request is already ${request.status}.` });
    }

    if (request.staffId) {
      return res.status(400).json({ msg: "Staff already assigned to this request." });
    }

    const owns = await userOwnsRequestGarage(req.user.id, request);
    if (!owns) return res.status(403).json({ msg: "Not your garage request." });

    const staff = await User.findOne({
      _id: staffId,
      role: "staff",
      garageId: request.garageId,
      isActive: { $ne: false },
    });
    if (!staff) {
      return res.status(400).json({ msg: "Invalid or inactive staff member for this garage." });
    }

    request.staffId = staff._id;
    request.assignedStaffName = staff.name;
    request.status = "assigned";
    await request.save();

    const populated = await ServiceRequest.findById(request._id)
      .populate("customerId", "name phone")
      .populate("staffId", "name phone");

    res.json({ msg: "Staff assigned successfully.", request: populated });
  } catch (err) {
    res.status(500).json({ msg: "Could not assign staff.", error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["en_route", "arrived", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ msg: "Invalid status for this action." });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: "Request not found." });

    const isStaff = req.user.role === "staff" && sameId(request.staffId, req.user.id);
    const isOwner = req.user.role === "mechanic" && (await userOwnsRequestGarage(req.user.id, request));

    if (!isStaff && !isOwner) {
      return res.status(403).json({ msg: "Not allowed to update this request." });
    }

    request.status = status;
    await request.save();
    res.json({ msg: "Status updated.", request });
  } catch (err) {
    res.status(500).json({ msg: "Could not update status.", error: err.message });
  }
};

exports.completeRequest = async (req, res) => {
  try {
    const { repairAmount = 0, repairPaymentMethod } = req.body;
    const repair = Number(repairAmount) || 0;

    let repairMethod = null;
    if (repair > 0) {
      repairMethod = normalizePaymentMethod(repairPaymentMethod);
      if (!repairMethod) {
        return res.status(400).json({
          msg: "Select how the customer paid for on-site repair: Cash, Card, or UPI/QR scan.",
        });
      }
    } else if (repairPaymentMethod) {
      repairMethod = normalizePaymentMethod(repairPaymentMethod);
    }
    if (repair < 0) {
      return res.status(400).json({ msg: "Repair amount cannot be negative." });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: "Request not found." });

    if (request.status === "completed") {
      return res.status(400).json({ msg: "This job is already completed." });
    }

    const isStaff = req.user.role === "staff" && sameId(request.staffId, req.user.id);
    const isOwner = req.user.role === "mechanic" && (await userOwnsRequestGarage(req.user.id, request));

    if (!isStaff && !isOwner) {
      return res.status(403).json({ msg: "Not allowed to complete this request." });
    }

    request.repairAmount = repair;
    if (repairMethod) {
      request.repairPaymentMethod = repairMethod;
    } else {
      request.repairPaymentMethod = undefined;
    }
    request.platformCommission = ServiceRequest.calcCommission(request.fixedFee, request.repairAmount);
    request.status = "completed";
    await request.save();

    const total = request.fixedFee + request.repairAmount;
    res.json({
      msg: `Job completed. Total collected ₹${total} (visit ₹${request.fixedFee} + repair ₹${repair}).`,
      request,
    });
  } catch (err) {
    res.status(500).json({ msg: "Could not complete request.", error: err.message });
  }
};

exports.getGarageForOwner = getGarageForOwner;
