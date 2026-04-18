const express = require("express");
const validate = require("../middleware/validate");
const { protectRoute, roleGuard } = require("../middleware/auth");
const {
  createBookingValidators,
  bookingActionValidators,
  createBooking,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
  rateBooking,
  getMessages,
  createMessage,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", protectRoute, roleGuard(["customer"]), createBookingValidators, validate, createBooking);
router.get("/my", protectRoute, roleGuard(["customer"]), getMyBookings);
router.get("/:id", protectRoute, bookingActionValidators, validate, getBookingDetail);
router.delete("/:id/cancel", protectRoute, bookingActionValidators, validate, cancelBooking);
router.put("/:id/accept", protectRoute, roleGuard(["driver", "hamali", "admin"]), bookingActionValidators, validate, acceptBooking);
router.put("/:id/reject", protectRoute, roleGuard(["driver", "hamali", "admin"]), bookingActionValidators, validate, rejectBooking);
router.put("/:id/start", protectRoute, roleGuard(["driver", "hamali", "admin"]), bookingActionValidators, validate, startBooking);
router.put("/:id/complete", protectRoute, roleGuard(["driver", "hamali", "admin"]), bookingActionValidators, validate, completeBooking);
router.post("/:id/rate", protectRoute, roleGuard(["customer"]), bookingActionValidators, validate, rateBooking);
router.get("/:id/messages", protectRoute, bookingActionValidators, validate, getMessages);
router.post("/:id/messages", protectRoute, bookingActionValidators, validate, createMessage);

module.exports = router;
