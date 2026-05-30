const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const locationController = require("../controllers/locationController");

router.post("/staff", auth, locationController.updateStaffLocation);
router.get("/staff/:requestId", auth, locationController.getStaffLocation);

module.exports = router;
