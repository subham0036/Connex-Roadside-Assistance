const Garage = require("../models/Garage");
const ServiceRequest = require("../models/ServiceRequest");

exports.getGarageForOwner = async (userId) => Garage.findOne({ userId });

exports.userOwnsRequestGarage = async (userId, request) => {
  const garage = await Garage.findById(request.garageId);
  return garage && garage.userId.toString() === userId.toString();
};

exports.getRequestOr404 = async (id) => ServiceRequest.findById(id);
