const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/stats", auth, requireRole("admin"), adminController.getStats);
router.get("/garages", auth, requireRole("admin"), adminController.getAllGarages);
router.patch("/garages/:id/approval", auth, requireRole("admin"), adminController.setGarageApproval);
router.get("/requests", auth, requireRole("admin"), adminController.getAllRequests);
router.get("/staff", auth, requireRole("admin"), adminController.getAllStaff);
router.get("/customers", auth, requireRole("admin"), adminController.getAllCustomers);

module.exports = router;
