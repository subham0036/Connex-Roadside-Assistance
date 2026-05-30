const StaffLocation = require("../models/StaffLocation");
const ServiceRequest = require("../models/ServiceRequest");
const Garage = require("../models/Garage");

exports.updateStaffLocation = async (req, res) => {
  try {
    const { requestId, lat, lng } = req.body;
    if (!requestId || lat == null || lng == null) {
      return res.status(400).json({ msg: "requestId, lat, and lng are required." });
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });

    if (req.user.role !== "staff") {
      return res.status(403).json({ msg: "Only field staff can update live location." });
    }

    if (request.staffId?.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not your assigned job." });
    }

    const location = await StaffLocation.findOneAndUpdate(
      { requestId },
      { staffId: req.user.id, lat: Number(lat), lng: Number(lng), updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, location });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getStaffLocation = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ msg: "Request not found." });

    const isCustomer = req.user.role === "customer" && request.customerId?.toString() === req.user.id;
    let isGarageOwner = false;
    if (req.user.role === "mechanic") {
      const garage = await Garage.findById(request.garageId);
      isGarageOwner = garage && garage.userId?.toString() === req.user.id;
    }
    const isStaff = req.user.role === "staff" && request.staffId?.toString() === req.user.id;

    if (!isCustomer && !isGarageOwner && !isStaff) {
      return res.status(403).json({ msg: "Not allowed to view this location." });
    }

    const location = await StaffLocation.findOne({ requestId: request._id });
    if (!location) {
      return res.json({ success: true, location: null });
    }

    res.json({
      success: true,
      location: {
        lat: location.lat,
        lng: location.lng,
        updatedAt: location.updatedAt,
        staffId: location.staffId,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
