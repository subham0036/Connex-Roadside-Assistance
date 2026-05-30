const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/", auth, requireRole("mechanic"), staffController.createStaff);
router.get("/", auth, requireRole("mechanic"), staffController.getStaff);
router.put("/:id", auth, requireRole("mechanic"), staffController.updateStaff);
router.delete("/:id", auth, requireRole("mechanic"), staffController.deactivateStaff);

module.exports = router;
