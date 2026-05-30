const User = require("../models/User");
const Garage = require("../models/Garage");
const ServiceRequest = require("../models/ServiceRequest");

exports.getStats = async (req, res) => {
  try {
    const [customers, garages, staff, requests, completed] = await Promise.all([
      User.countDocuments({ role: "customer" }),
      Garage.countDocuments({ isApproved: true }),
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
    const garage = await Garage.findByIdAndUpdate(
      req.params.id,
      { isApproved: Boolean(isApproved) },
      { new: true }
    );
    if (!garage) return res.status(404).json({ msg: "Garage not found." });
    res.json({ msg: isApproved ? "Garage approved." : "Garage suspended.", garage });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
