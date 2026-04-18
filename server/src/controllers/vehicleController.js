const { body, query, param } = require("express-validator");
const Vehicle = require("../models/Vehicle");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");
const { haversineDistance } = require("../utils/geo");

const availableValidators = [
  query("lat").isFloat(),
  query("lng").isFloat(),
  query("type").optional().isIn(["mini_truck", "tempo", "truck_407", "truck_1ton", "truck_2ton", "heavy"]),
  query("radius").optional().isFloat({ min: 1 }),
];

const createVehicleValidators = [
  body("type").isIn(["mini_truck", "tempo", "truck_407", "truck_1ton", "truck_2ton", "heavy"]),
  body("registrationNumber").notEmpty(),
  body("capacityTons").isFloat({ min: 0.1 }),
];

const updateVehicleValidators = [param("id").isMongoId()];

const listAvailableVehicles = asyncHandler(async (req, res) => {
  const radius = Number(req.query.radius || 30);
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const filters = { isAvailable: true, isVerified: true };
  if (req.query.type) filters.type = req.query.type;

  const vehicles = await Vehicle.find(filters).populate("driverId", "name rating profilePhoto phone");
  const nearby = vehicles
    .map((vehicle) => ({
      ...vehicle.toObject(),
      distanceKm: haversineDistance({ lat, lng }, vehicle.currentLocation),
    }))
    .filter((vehicle) => vehicle.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return ok(res, { vehicles: nearby }, "Available vehicles");
});

const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create({
    ...req.body,
    driverId: req.user._id,
  });

  return ok(res, { vehicle }, "Vehicle registered", 201);
});

const getMine = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ driverId: req.user._id });
  return ok(res, { vehicles }, "Your vehicles");
});

const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, driverId: req.user._id },
    req.body,
    { new: true }
  );
  if (!vehicle) return fail(res, "Vehicle not found", 404);
  return ok(res, { vehicle }, "Vehicle updated");
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, driverId: req.user._id });
  if (!vehicle) return fail(res, "Vehicle not found", 404);
  return ok(res, {}, "Vehicle deleted");
});

module.exports = {
  availableValidators,
  createVehicleValidators,
  updateVehicleValidators,
  listAvailableVehicles,
  createVehicle,
  getMine,
  updateVehicle,
  deleteVehicle,
};
