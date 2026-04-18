const Booking = require("../models/Booking");
const Vehicle = require("../models/Vehicle");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");
const { haversineDistance } = require("../utils/geo");
const { getIO } = require("../services/socket");

const getIncomingBookings = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ driverId: req.user._id });
  if (!vehicle) return fail(res, "Vehicle not found", 404);

  const pending = await Booking.find({ bookingType: "transport", status: "pending" }).populate("customerId", "name phone");
  const bookings = pending
    .map((booking) => ({
      ...booking.toObject(),
      distanceToPickup: haversineDistance(vehicle.currentLocation, booking.pickup),
      expiresInSeconds: Math.max(0, 300 - Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 1000)),
    }))
    .filter((booking) => booking.distanceToPickup <= 30);

  return ok(res, { bookings }, "Incoming driver bookings");
});

const updateLocation = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { driverId: req.user._id },
    { currentLocation: req.body, isAvailable: true },
    { new: true }
  );

  const activeBookings = await Booking.find({ providerId: req.user._id, status: "in_progress" });
  activeBookings.forEach((booking) => {
    getIO().to(booking.bookingId).emit("driver:location", {
      bookingRoom: booking.bookingId,
      providerCoords: req.body,
      providerId: String(req.user._id),
    });
  });

  return ok(res, { vehicle }, "Driver location updated");
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { driverId: req.user._id },
    { isAvailable: req.body.isAvailable },
    { new: true }
  );
  return ok(res, { vehicle }, "Availability updated");
});

const getEarnings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ providerId: req.user._id, bookingType: "transport", paymentStatus: "paid" });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sum = (list) => list.reduce((total, booking) => total + (booking.finalFare || 0), 0);
  const series = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const total = sum(
      bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt).toISOString().slice(0, 10) === key)
    );
    return { date: key, total };
  });

  return ok(
    res,
    {
      today: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= todayStart)),
      week: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= weekStart)),
      month: sum(bookings.filter((booking) => new Date(booking.completedAt || booking.updatedAt) >= monthStart)),
      allTime: sum(bookings),
      series,
      bookings,
    },
    "Driver earnings"
  );
});

const getDriverBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ providerId: req.user._id, bookingType: "transport" }).populate("customerId", "name phone");
  return ok(res, { bookings }, "Driver booking history");
});

module.exports = {
  getIncomingBookings,
  updateLocation,
  toggleAvailability,
  getEarnings,
  getDriverBookings,
};
