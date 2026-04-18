const express = require("express");
const validate = require("../middleware/validate");
const { protectRoute, roleGuard } = require("../middleware/auth");
const {
  hamaliAvailableValidators,
  hamaliProfileValidators,
  getAvailableHamali,
  createProfile,
  getMine,
  updateMine,
} = require("../controllers/hamaliController");

const router = express.Router();

router.get("/available", hamaliAvailableValidators, validate, getAvailableHamali);
router.post("/profile", protectRoute, roleGuard(["hamali"]), hamaliProfileValidators, validate, createProfile);
router.get("/profile/mine", protectRoute, roleGuard(["hamali"]), getMine);
router.put("/profile", protectRoute, roleGuard(["hamali"]), hamaliProfileValidators, validate, updateMine);

module.exports = router;
