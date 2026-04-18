const Booking = require("../models/Booking");
const HamaliProfile = require("../models/HamaliProfile");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { haversineDistance } = require("../utils/geo");
const { getIO } = require("../services/socket");

const getIncomingJobs = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOne({ workerId: req.user._id });
  const pending = await Booking.find({ bookingType: "hamali", status: "pending" }).populate("customerId", "name phone");
  const bookings = pending
    .map((booking) => ({
      ...booking.toObject(),
      distanceToPickup: haversineDistance(profile.currentLocation, booking.pickup),
      expiresInSeconds: Math.max(0, 300 - Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 1000)),
    }))
    .filter((booking) => booking.distanceToPickup <= 30);
  return ok(res, { bookings }, "Incoming hamali jobs");
});

const updateLocation = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: req.user._id },
    { currentLocation: req.body, isAvailable: true },
    { new: true }
  );
  const activeJobs = await Booking.find({ providerId: req.user._id, bookingType: "hamali", status: "in_progress" });
  activeJobs.forEach((booking) => {
    getIO().to(booking.bookingId).emit("driver:location", {
      bookingRoom: booking.bookingId,
      providerCoords: req.body,
      providerId: String(req.user._id),
    });
  });
  return ok(res, { profile }, "Hamali location updated");
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: req.user._id },
    { isAvailable: req.body.isAvailable },
    { new: true }
  );
  return ok(res, { profile }, "Availability updated");
});

const getEarnings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ providerId: req.user._id, bookingType: "hamali", paymentStatus: "paid" });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sum = (list) => list.reduce((acc, booking) => acc + (booking.finalFare || 0), 0);

  return ok(
    res,
    {
      today: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= todayStart)),
      week: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= weekStart)),
      month: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= monthStart)),
      allTime: sum(bookings),
      bookings,
    },
    "Hamali earnings"
  );
});

const getHamaliBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ providerId: req.user._id, bookingType: "hamali" }).populate("customerId", "name phone");
  return ok(res, { bookings }, "Hamali booking history");
});

module.exports = {
  getIncomingJobs,
  updateLocation,
  toggleAvailability,
  getEarnings,
  getHamaliBookings,
};
