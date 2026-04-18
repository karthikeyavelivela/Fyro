const express = require("express");
const validate = require("../middleware/validate");
const { protectRoute, roleGuard } = require("../middleware/auth");
const {
  availableValidators,
  createVehicleValidators,
  updateVehicleValidators,
  listAvailableVehicles,
  createVehicle,
  getMine,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const router = express.Router();

router.get("/available", availableValidators, validate, listAvailableVehicles);
router.post("/", protectRoute, roleGuard(["driver"]), createVehicleValidators, validate, createVehicle);
router.get("/mine", protectRoute, roleGuard(["driver"]), getMine);
router.put("/:id", protectRoute, roleGuard(["driver"]), updateVehicleValidators, validate, updateVehicle);
router.delete("/:id", protectRoute, roleGuard(["driver"]), updateVehicleValidators, validate, deleteVehicle);

module.exports = router;
