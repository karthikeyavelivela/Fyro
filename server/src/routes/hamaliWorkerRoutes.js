const express = require("express");
const { protectRoute, roleGuard } = require("../middleware/auth");
const { getIncomingJobs, updateLocation, toggleAvailability, getEarnings, getHamaliBookings } = require("../controllers/hamaliWorkerController");

const router = express.Router();

router.get("/incoming", protectRoute, roleGuard(["hamali"]), getIncomingJobs);
router.put("/location", protectRoute, roleGuard(["hamali"]), updateLocation);
router.put("/availability", protectRoute, roleGuard(["hamali"]), toggleAvailability);
router.get("/earnings", protectRoute, roleGuard(["hamali"]), getEarnings);
router.get("/bookings", protectRoute, roleGuard(["hamali"]), getHamaliBookings);

module.exports = router;
