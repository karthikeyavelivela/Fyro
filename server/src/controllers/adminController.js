const User = require("../models/User");
const Booking = require("../models/Booking");
const Complaint = require("../models/Complaint");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");

const getUsers = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }
  const users = await User.find(query).select("-passwordHash");
  return ok(res, { users }, "Admin users");
});

const getBookings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.bookingType) query.bookingType = req.query.bookingType;
  const bookings = await Booking.find(query).populate("customerId providerId vehicleId");
  return ok(res, { bookings }, "Admin bookings");
});

const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find(req.query.status ? { status: req.query.status } : {}).populate("bookingId raisedBy againstUser");
  return ok(res, { complaints }, "Admin complaints");
});

const updateKyc = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isKYCApproved: req.body.isKYCApproved, isVerified: req.body.isKYCApproved },
    { new: true }
  ).select("-passwordHash");
  return ok(res, { user }, "KYC updated");
});

const getStats = asyncHandler(async (req, res) => {
  const [userCount, bookingsToday, openComplaints, pendingKyc, paidBookings] = await Promise.all([
    User.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    Complaint.countDocuments({ status: { $in: ["open", "under_review"] } }),
    User.countDocuments({ role: { $in: ["driver", "hamali"] }, isKYCApproved: false }),
    Booking.find({ paymentStatus: "paid" }),
  ]);
  const revenueToday = paidBookings
    .filter((booking) => booking.paidAt && new Date(booking.paidAt) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .reduce((total, booking) => total + (booking.finalFare || 0), 0);

  return ok(
    res,
    {
      totalUsers: userCount,
      bookingsToday,
      revenueToday,
      openComplaints,
      pendingKyc,
    },
    "Admin stats"
  );
});

module.exports = {
  getUsers,
  getBookings,
  getComplaints,
  updateKyc,
  getStats,
};
