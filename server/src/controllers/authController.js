const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const HamaliProfile = require("../models/HamaliProfile");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");
const { signToken } = require("../utils/jwt");
const { COOKIE_NAME } = require("../middleware/auth");
const env = require("../config/env");

const registerValidators = [
  body("name").trim().notEmpty(),
  body("email").isEmail(),
  body("phone").isLength({ min: 10 }),
  body("password").isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
  body("role").isIn(["customer", "driver", "hamali"]),
  body("language").optional().isIn(["en", "hi", "te"]),
];

const loginValidators = [body("identifier").notEmpty(), body("password").notEmpty()];

function attachAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.nodeEnv === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, language, vehicle, hamaliProfile } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    return fail(res, "User with this email or phone already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    language: language || "en",
  });

  if (role === "driver" && vehicle) {
    await Vehicle.create({
      driverId: user._id,
      type: vehicle.type,
      registrationNumber: vehicle.registrationNumber,
      capacityTons: vehicle.capacityTons,
      photos: vehicle.photos || [],
      currentLocation: vehicle.currentLocation || { lat: 16.5062, lng: 80.648 },
      isAvailable: false,
      isVerified: env.nodeEnv !== "production", // auto-verify in dev
    });
  }

  if (role === "hamali" && hamaliProfile) {
    await HamaliProfile.create({
      workerId: user._id,
      teamSize: hamaliProfile.teamSize,
      ratePerJob: hamaliProfile.ratePerJob,
      ratePerHour: hamaliProfile.ratePerHour,
      skills: hamaliProfile.skills || [],
      city: hamaliProfile.city,
      area: hamaliProfile.area,
      currentLocation: hamaliProfile.currentLocation,
      isAvailable: false,
    });
  }

  const token = signToken({ userId: user._id, role: user.role });
  attachAuthCookie(res, token);

  return ok(res, { user }, "Registration successful", 201);
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
  });

  if (!user) {
    return fail(res, "Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return fail(res, "Invalid credentials", 401);
  }

  const token = signToken({ userId: user._id, role: user.role });
  attachAuthCookie(res, token);

  return ok(res, { user: { ...user.toObject(), passwordHash: undefined } }, "Login successful");
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return ok(res, {}, "Logged out");
});

const me = asyncHandler(async (req, res) => ok(res, { user: req.user }, "Current user"));

module.exports = {
  registerValidators,
  loginValidators,
  register,
  login,
  logout,
  me,
};
