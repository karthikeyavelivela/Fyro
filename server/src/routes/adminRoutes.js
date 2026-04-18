const express = require("express");
const { protectRoute, roleGuard } = require("../middleware/auth");
const { getUsers, getBookings, getComplaints, updateKyc, getStats } = require("../controllers/adminController");
const { updateComplaint } = require("../controllers/complaintController");

const router = express.Router();

router.use(protectRoute, roleGuard(["admin"]));
router.get("/users", getUsers);
router.get("/bookings", getBookings);
router.get("/complaints", getComplaints);
router.put("/complaints/:id", updateComplaint);
router.put("/kyc/:userId", updateKyc);
router.get("/stats", getStats);

module.exports = router;
