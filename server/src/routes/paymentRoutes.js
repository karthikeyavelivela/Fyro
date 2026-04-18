const express = require("express");
const { protectRoute, roleGuard } = require("../middleware/auth");
const { createOrder, verifyPayment, getReceipt, getMyPayments } = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", protectRoute, roleGuard(["customer"]), createOrder);
router.post("/verify", protectRoute, roleGuard(["customer"]), verifyPayment);
router.get("/receipt/:id", protectRoute, getReceipt);
router.get("/my", protectRoute, roleGuard(["customer"]), getMyPayments);

module.exports = router;
