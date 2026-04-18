const express = require("express");
const { protectRoute } = require("../middleware/auth");
const { updateProfile, changePassword, createSupportTicket } = require("../controllers/userController");

const router = express.Router();

router.put("/profile", protectRoute, updateProfile);
router.put("/profile/password", protectRoute, changePassword);
router.post("/support", protectRoute, createSupportTicket);

module.exports = router;
