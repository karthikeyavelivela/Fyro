const bcrypt = require("bcryptjs");
const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name,
    phone: req.body.phone,
    profilePhoto: req.body.profilePhoto,
    language: req.body.language,
  };

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-passwordHash");
  return ok(res, { user }, "Profile updated");
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const matches = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
  if (!matches) return fail(res, "Current password is incorrect", 400);
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  return ok(res, {}, "Password updated");
});

const createSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.create({
    userId: req.user?._id,
    name: req.body.name || req.user?.name,
    email: req.body.email || req.user?.email,
    phone: req.body.phone || req.user?.phone,
    message: req.body.message,
  });
  return ok(res, { ticket }, "Support request created", 201);
});

module.exports = {
  updateProfile,
  changePassword,
  createSupportTicket,
};
