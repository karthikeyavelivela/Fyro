const express = require("express");
const { protectRoute, roleGuard } = require("../middleware/auth");
const { createComplaint, getMyComplaints, getComplaint, updateComplaint } = require("../controllers/complaintController");

const router = express.Router();

router.post("/", protectRoute, roleGuard(["customer"]), createComplaint);
router.get("/my", protectRoute, roleGuard(["customer"]), getMyComplaints);
router.get("/:id", protectRoute, getComplaint);
router.put("/:id", protectRoute, roleGuard(["admin"]), updateComplaint);

module.exports = router;
