const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/create", auth, requireRole("customer"), requestController.createRequest);
router.get("/mine", auth, requestController.getRequests);
router.get("/all", auth, requireRole("admin"), requestController.getRequests);
router.post("/:id/assign", auth, requireRole("mechanic"), requestController.assignStaff);
router.post("/:id/complete", auth, requestController.completeRequest);
router.post("/:id/status", auth, requestController.updateStatus);

module.exports = router;
