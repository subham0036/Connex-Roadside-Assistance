const express = require("express");
const router = express.Router();
const garageController = require("../controllers/garageController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/register", auth, requireRole("mechanic"), garageController.registerGarage);
router.get("/mine", auth, requireRole("mechanic"), garageController.getMyGarage);
router.put("/mine", auth, requireRole("mechanic"), garageController.updateGarage);
router.get("/all", garageController.getAllGarages);
router.get("/nearby", garageController.getNearbyGarages);

module.exports = router;
