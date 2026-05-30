const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Garage = require("../models/Garage");

exports.createStaff = async (req, res) => {
  try {
    if (req.user.role !== "mechanic") {
      return res.status(403).json({ msg: "Only garage owners can add staff." });
    }

    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) {
      return res.status(400).json({ msg: "Register your garage before adding staff." });
    }

    const { name, email, password, phone, address, age } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required." });
    }
    if (!phone?.trim()) {
      return res.status(400).json({ msg: "Staff phone number is required." });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "Email already in use." });

    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const staff = await User.create({
      name,
      email,
      password: hashedPass,
      phone: phone.trim(),
      address: address?.trim() || "",
      age: age != null && age !== "" ? Number(age) : undefined,
      role: "staff",
      garageId: garage._id,
    });

    res.status(201).json({
      msg: "Staff member added.",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        address: staff.address,
        age: staff.age,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Could not add staff.", error: err.message });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) return res.json([]);

    const filter = { role: "staff", garageId: garage._id };
    if (req.query.all !== "true") filter.isActive = true;

    const staff = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ msg: "Could not fetch staff.", error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) return res.status(404).json({ msg: "Garage not found." });

    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
      garageId: garage._id,
    });
    if (!staff) return res.status(404).json({ msg: "Staff not found." });

    const { name, phone, password, email, address, age } = req.body;
    if (name) staff.name = name;
    if (phone !== undefined) staff.phone = phone;
    if (address !== undefined) staff.address = address;
    if (age !== undefined && age !== "") staff.age = Number(age);
    if (age === "" || age === null) staff.age = undefined;
    if (email && email !== staff.email) {
      const taken = await User.findOne({ email, _id: { $ne: staff._id } });
      if (taken) return res.status(400).json({ msg: "Email already in use." });
      staff.email = email;
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      staff.password = await bcrypt.hash(password, salt);
    }
    await staff.save();

    res.json({
      msg: "Staff updated.",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        address: staff.address,
        age: staff.age,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Could not update staff.", error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  return exports.deactivateStaff(req, res);
};

exports.deactivateStaff = async (req, res) => {
  try {
    const garage = await Garage.findOne({ userId: req.user.id });
    if (!garage) return res.status(404).json({ msg: "Garage not found." });

    const staff = await User.findOne({
      _id: req.params.id,
      role: "staff",
      garageId: garage._id,
    });
    if (!staff) return res.status(404).json({ msg: "Staff not found." });

    staff.isActive = false;
    await staff.save();
    res.json({ msg: "Staff deactivated." });
  } catch (err) {
    res.status(500).json({ msg: "Could not deactivate staff.", error: err.message });
  }
};
