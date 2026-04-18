const express = require("express");
const { protectRoute, roleGuard } = require("../middleware/auth");
const { getIncomingBookings, updateLocation, toggleAvailability, getEarnings, getDriverBookings } = require("../controllers/driverController");

const router = express.Router();

router.get("/incoming", protectRoute, roleGuard(["driver"]), getIncomingBookings);
router.put("/location", protectRoute, roleGuard(["driver"]), updateLocation);
router.put("/availability", protectRoute, roleGuard(["driver"]), toggleAvailability);
router.get("/earnings", protectRoute, roleGuard(["driver"]), getEarnings);
router.get("/bookings", protectRoute, roleGuard(["driver"]), getDriverBookings);

module.exports = router;
