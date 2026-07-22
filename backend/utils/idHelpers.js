const mongoose = require("mongoose");

const refId = (value) => {
  if (value == null) return null;
  if (typeof value === "object" && value._id != null) return value._id;
  return value;
};

exports.sameId = (a, b) => {
  const left = refId(a);
  const right = refId(b);
  return left != null && right != null && String(left) === String(right);
};

exports.isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

exports.invalidIdResponse = (res) => res.status(400).json({ msg: "Invalid request id." });
