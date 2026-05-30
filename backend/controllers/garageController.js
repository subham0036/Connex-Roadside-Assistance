const Garage = require("../models/Garage");
const User = require("../models/User");

function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

exports.registerGarage = async (req, res) => {
  try {
    if (req.user.role !== "mechanic") {
      return res.status(403).json({ msg: "Only garage owners can register a garage." });
    }

    const { shopName, phone, address, fixedFee, lat, lng, services } = req.body;
    if (!shopName || !phone || !address || fixedFee == null) {
      return res.status(400).json({ msg: "Shop name, phone, address, and visit fee are required." });
    }

    const existing = await Garage.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ msg: "Garage already registered. Update your profile instead." });
    }

    const garage = await Garage.create({
      userId: req.user.id,
      shopName,
      phone,
      address,
      fixedFee: Number(fixedFee),
      location: { lat: Number(lat), lng: Number(lng) },
      services: services || undefined,
      isApproved: true,
    });

    res.status(201).json({ msg: "Garage listed on Connex successfully.", garage });
  } catch (err) {
    res.status(500).json({ msg: "Could not register garage.", error: err.message });
  }
};

exports.getMyGarage = async (req, res) => {
  try {
    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) return res.status(404).json({ msg: "No garage registered yet." });
    res.json(garage);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch garage.", error: err.message });
  }
};

exports.updateGarage = async (req, res) => {
  try {
    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) return res.status(404).json({ msg: "Garage not found." });

    const { shopName, phone, address, fixedFee, lat, lng, services } = req.body;
    if (shopName) garage.shopName = shopName;
    if (phone) garage.phone = phone;
    if (address) garage.address = address;
    if (fixedFee != null) garage.fixedFee = Number(fixedFee);
    if (lat != null && lng != null) garage.location = { lat: Number(lat), lng: Number(lng) };
    if (services) garage.services = services;
    await garage.save();

    res.json({ msg: "Garage updated.", garage });
  } catch (err) {
    res.status(500).json({ msg: "Could not update garage.", error: err.message });
  }
};

exports.getAllGarages = async (req, res) => {
  try {
    const garages = await Garage.find({ isApproved: true }).populate("userId", "name email phone");
    res.json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNearbyGarages = async (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase();
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusKm = Math.min(parseFloat(req.query.radiusKm) || 25, 50);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ msg: "Valid lat and lng are required for nearby search." });
    }

    let garages = await Garage.find({ isApproved: true }).populate("userId", "name email phone");

    if (query) {
      garages = garages.filter(
        (g) =>
          g.shopName.toLowerCase().includes(query) ||
          g.address.toLowerCase().includes(query)
      );
    }

    const result = garages
      .map((g) => {
        const gLat = g.location?.lat;
        const gLng = g.location?.lng;
        if (gLat == null || gLng == null || Number.isNaN(gLat) || Number.isNaN(gLng)) {
          return null;
        }
        const distance = getDistance(lat, lng, gLat, gLng);
        const etaMinutes = Math.max(3, Math.round(distance * 3));
        return {
          ...g.toObject(),
          distance: Number(distance.toFixed(2)),
          etaMinutes,
        };
      })
      .filter((g) => g && g.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      customerLocation: { lat, lng },
      radiusKm,
      count: result.length,
      garages: result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
