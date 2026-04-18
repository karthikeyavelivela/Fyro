const { body, query } = require("express-validator");
const HamaliProfile = require("../models/HamaliProfile");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { haversineDistance } = require("../utils/geo");

const hamaliProfileValidators = [
  body("teamSize").isInt({ min: 1 }),
  body("ratePerJob").isFloat({ min: 1 }),
  body("ratePerHour").isFloat({ min: 1 }),
];

const hamaliAvailableValidators = [query("lat").isFloat(), query("lng").isFloat(), query("radius").optional().isFloat()];

const getAvailableHamali = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius || 20);
  const profiles = await HamaliProfile.find({ isAvailable: true, isVerified: true }).populate(
    "workerId",
    "name rating profilePhoto phone"
  );

  const nearby = profiles
    .map((profile) => ({
      ...profile.toObject(),
      distanceKm: haversineDistance({ lat, lng }, profile.currentLocation),
    }))
    .filter((profile) => profile.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return ok(res, { providers: nearby }, "Available hamali workers");
});

const createProfile = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: req.user._id },
    { ...req.body, workerId: req.user._id },
    { upsert: true, new: true }
  );
  return ok(res, { profile }, "Hamali profile saved", 201);
});

const getMine = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOne({ workerId: req.user._id });
  return ok(res, { profile }, "Hamali profile");
});

const updateMine = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOneAndUpdate({ workerId: req.user._id }, req.body, { new: true });
  return ok(res, { profile }, "Hamali profile updated");
});

module.exports = {
  hamaliAvailableValidators,
  hamaliProfileValidators,
  getAvailableHamali,
  createProfile,
  getMine,
  updateMine,
};
