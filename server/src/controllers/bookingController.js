const { body, param } = require("express-validator");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const HamaliProfile = require("../models/HamaliProfile");
const Message = require("../models/Message");
const asyncHandler = require("../utils/asyncHandler");
const { ok, fail } = require("../utils/response");
const { generateBookingId } = require("../utils/ids");
const { calculateTransportFare, calculateHamaliFare } = require("../utils/fareEngine");
const { haversineDistance } = require("../utils/geo");
const { getIO } = require("../services/socket");

const createBookingValidators = [
  body("bookingType").isIn(["transport", "hamali"]),
  body("pickup.address").notEmpty(),
  body("pickup.lat").isFloat(),
  body("pickup.lng").isFloat(),
  body("scheduledAt").optional().isISO8601(),
];

async function computeTransportReturnDiscount(providerId, pickup) {
  const existing = await Booking.findOne({
    providerId,
    bookingType: "transport",
    status: { $in: ["accepted", "in_progress"] },
  });

  if (!existing?.dropoff) return false;
  return haversineDistance(existing.dropoff, pickup) <= 30;
}

async function emitNewBooking(booking) {
  const io = getIO();
  if (booking.bookingType === "transport") {
    const vehicles = await Vehicle.find({ isAvailable: true, isVerified: true }).populate("driverId");
    vehicles.forEach((vehicle) => {
      if (haversineDistance(booking.pickup, vehicle.currentLocation) <= 30) {
        io.to(String(vehicle.driverId._id)).emit("booking:new", { booking });
      }
    });
    return;
  }

  const profiles = await HamaliProfile.find({ isAvailable: true, isVerified: true }).populate("workerId");
  profiles.forEach((profile) => {
    if (haversineDistance(booking.pickup, profile.currentLocation) <= 30) {
      io.to(String(profile.workerId._id)).emit("booking:new", { booking });
    }
  });
}

const createBooking = asyncHandler(async (req, res) => {
  const payload = req.body;
  let estimatedFare = 0;
  let fareBreakdown = null;
  let vehicleId = payload.vehicleId || null;

  if (payload.bookingType === "transport") {
    const vehicle = await Vehicle.findById(payload.vehicleId);
    if (!vehicle) return fail(res, "Vehicle not found", 404);

    const hasReturnLoadDiscount = await computeTransportReturnDiscount(vehicle.driverId, payload.pickup);
    const fare = calculateTransportFare({
      vehicleType: vehicle.type,
      distanceKm: payload.distanceKm || haversineDistance(payload.pickup, payload.dropoff),
      hasReturnLoadDiscount,
    });
    estimatedFare = fare.total;
    fareBreakdown = fare.fareBreakdown;
  } else {
    const provider = await HamaliProfile.findById(payload.hamaliProfileId);
    if (!provider) return fail(res, "Hamali provider not found", 404);
    const fare = calculateHamaliFare({
      teamSize: payload.hamaliDetails?.teamSize || provider.teamSize,
      estimatedHours: payload.hamaliDetails?.estimatedHours,
      heavyGoods: payload.hamaliDetails?.heavyGoods,
      floorNumber: payload.hamaliDetails?.floorNumber,
    });
    estimatedFare = fare.total;
    fareBreakdown = fare.fareBreakdown;
    vehicleId = null;
  }

  const booking = await Booking.create({
    bookingId: await generateBookingId(),
    customerId: req.user._id,
    providerId: payload.providerId,
    bookingType: payload.bookingType,
    pickup: payload.pickup,
    dropoff: payload.dropoff,
    vehicleId,
    hamaliDetails: payload.hamaliDetails,
    scheduledAt: payload.scheduledAt || new Date(),
    distanceKm: payload.distanceKm || 0,
    estimatedFare,
    finalFare: estimatedFare,
    fareBreakdown,
  });

  await Message.create({
    bookingId: booking._id,
    senderId: req.user._id,
    content: `Booking ${booking.bookingId} created`,
    type: "system",
  });

  await emitNewBooking(booking);
  return ok(res, { booking }, "Booking created", 201);
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user._id })
    .populate("providerId", "name phone rating profilePhoto role")
    .populate("vehicleId");
  return ok(res, { bookings }, "Customer bookings");
});

const getBookingDetail = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("customerId", "name phone profilePhoto")
    .populate("providerId", "name phone rating profilePhoto role")
    .populate("vehicleId");
  if (!booking) return fail(res, "Booking not found", 404);
  return ok(res, { booking }, "Booking detail");
});

const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user._id });
  if (!booking) return fail(res, "Booking not found", 404);
  if (booking.status !== "pending") return fail(res, "Only pending bookings can be cancelled", 400);
  booking.status = "cancelled";
  await booking.save();
  getIO().to(String(booking.providerId)).emit("booking:status_update", { bookingId: booking.bookingId, status: "cancelled" });
  return ok(res, { booking }, "Booking cancelled");
});

const bookingActionValidators = [param("id").isMongoId()];

const updateBookingStatus = (status, successMessage, extraMutator) =>
  asyncHandler(async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return fail(res, "Booking not found", 404);

    const providerAllowed = String(booking.providerId) === String(req.user._id);
    const adminAllowed = req.user.role === "admin";
    if (!providerAllowed && !adminAllowed) return fail(res, "Forbidden", 403);

    booking.status = status;
    if (status === "accepted") booking.acceptedAt = new Date();
    if (status === "in_progress") booking.startedAt = new Date();
    if (status === "completed") booking.completedAt = new Date();
    if (extraMutator) extraMutator(booking, req);
    await booking.save();

    const eventMap = {
      accepted: "booking:accepted",
      rejected: "booking:rejected",
      in_progress: "booking:started",
      completed: "booking:completed",
    };

    const io = getIO();
    io.to(String(booking.customerId)).emit(eventMap[status] || "booking:status_update", {
      bookingId: booking.bookingId,
      status,
    });
    io.to(booking.bookingId).emit("booking:status_update", { bookingId: booking.bookingId, status });

    await Message.create({
      bookingId: booking._id,
      senderId: req.user._id,
      content: `Booking marked ${status.replace("_", " ")}`,
      type: "system",
    });

    return ok(res, { booking }, successMessage);
  });

const rateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user._id, status: "completed" });
  if (!booking) return fail(res, "Completed booking not found", 404);

  booking.customerRating = req.body.rating;
  booking.customerReview = req.body.review;
  await booking.save();

  if (booking.providerId && req.body.rating) {
    const provider = await User.findById(booking.providerId);
    const totalScore = provider.rating * provider.totalRatings + req.body.rating;
    provider.totalRatings += 1;
    provider.rating = totalScore / provider.totalRatings;
    await provider.save();
  }

  return ok(res, { booking }, "Rating submitted");
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ bookingId: req.params.id }).populate("senderId", "name role profilePhoto");
  return ok(res, { messages }, "Booking messages");
});

const createMessage = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return fail(res, "Booking not found", 404);

  const message = await Message.create({
    bookingId: booking._id,
    senderId: req.user._id,
    content: req.body.content,
    type: req.body.type || "text",
  });

  getIO().to(booking.bookingId).emit("message:new", { message });
  return ok(res, { message }, "Message sent", 201);
});

module.exports = {
  createBookingValidators,
  bookingActionValidators,
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  acceptBooking: updateBookingStatus("accepted", "Booking accepted"),
  rejectBooking: updateBookingStatus("rejected", "Booking rejected"),
  startBooking: updateBookingStatus("in_progress", "Booking started"),
  completeBooking: updateBookingStatus("completed", "Booking completed"),
  rateBooking,
  getMessages,
  createMessage,
};
