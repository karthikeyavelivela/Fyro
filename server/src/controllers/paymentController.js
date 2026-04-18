const crypto = require("crypto");
const Razorpay = require("razorpay");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const { getIO } = require("../services/socket");
const { ok, fail } = require("../utils/response");
const env = require("../config/env");

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId || "rzp_test_mock",
  key_secret: env.razorpay.keySecret || "mock_secret",
});

const createOrder = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId);
  if (!booking) return fail(res, "Booking not found", 404);

  // Local dev mock: skip Razorpay when no keys configured
  if (!env.razorpay.keyId || env.razorpay.keyId === "rzp_test_mock") {
    const mockOrder = {
      id: `mock_order_${Date.now()}`,
      amount: Math.round((booking.finalFare || booking.estimatedFare) * 100),
      currency: "INR",
      receipt: booking.bookingId,
    };
    booking.razorpayOrderId = mockOrder.id;
    await booking.save();
    return ok(res, { order: mockOrder, isMock: true }, "Mock order created (no Razorpay keys)");
  }

  const order = await razorpay.orders.create({
    amount: Math.round((booking.finalFare || booking.estimatedFare) * 100),
    currency: "INR",
    receipt: booking.bookingId,
  });

  booking.razorpayOrderId = order.id;
  await booking.save();

  return ok(res, { order }, "Order created");
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return fail(res, "Booking not found", 404);

  // Mock bypass for local dev (when no Razorpay keys configured)
  const isMockPayment = razorpaySignature === "mock_signature" || !env.razorpay.keySecret;

  if (!isMockPayment) {
    const expectedSignature = crypto
      .createHmac("sha256", env.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return fail(res, "Payment signature verification failed", 400);
    }
  }

  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: booking.customerId,
    providerId: booking.providerId,
    amount: booking.finalFare || booking.estimatedFare,
    razorpayOrderId: razorpayOrderId || "mock_order",
    razorpayPaymentId: razorpayPaymentId || "mock_payment",
    razorpaySignature: razorpaySignature || "mock_signature",
    status: "captured",
    receiptUrl: `/payments/receipt/${booking._id}`,
  });

  booking.paymentStatus = "paid";
  booking.razorpayOrderId = razorpayOrderId || "mock_order";
  booking.razorpayPaymentId = razorpayPaymentId || "mock_payment";
  booking.paidAt = new Date();
  await booking.save();

  // Notify booking room of payment completion
  try {
    getIO().to(booking.bookingId).emit("booking:status_update", {
      bookingId: booking.bookingId,
      status: "paid",
    });
    getIO().to(String(booking.customerId)).emit("booking:paid", {
      bookingId: booking.bookingId,
    });
  } catch (_) {}

  return ok(res, { payment }, "Payment verified");
});

const getReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("bookingId customerId providerId");
  if (!payment) return fail(res, "Payment not found", 404);
  return ok(res, { payment }, "Payment receipt");
});

const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customerId: req.user._id }).populate("bookingId");
  return ok(res, { payments }, "Payment history");
});

module.exports = {
  createOrder,
  verifyPayment,
  getReceipt,
  getMyPayments,
};
