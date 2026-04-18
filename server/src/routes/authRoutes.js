const express = require("express");
const rateLimit = require("express-rate-limit");
const validate = require("../middleware/validate");
const { protectRoute } = require("../middleware/auth");
const { registerValidators, loginValidators, register, login, logout, me } = require("../controllers/authController");

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post("/register", authLimiter, registerValidators, validate, register);
router.post("/login", authLimiter, loginValidators, validate, login);
router.post("/logout", protectRoute, logout);
router.get("/me", protectRoute, me);

module.exports = router;
