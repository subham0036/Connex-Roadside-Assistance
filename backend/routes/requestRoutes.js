const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/create", auth, requireRole("customer"), requestController.createRequest);
router.get("/mine", auth, requestController.getRequests);
router.get("/all", auth, requireRole("admin"), requestController.getRequests);
router.post("/:id/assign", auth, requireRole("mechanic"), requestController.assignStaff);
router.post("/:id/accept", auth, requireRole("mechanic"), requestController.acceptRequest);
router.post("/:id/reject", auth, requireRole("mechanic"), requestController.rejectRequest);
router.post("/:id/staff-accept", auth, requireRole("staff"), requestController.staffAcceptAssignment);
router.post("/:id/staff-decline", auth, requireRole("staff"), requestController.staffDeclineAssignment);
router.post("/:id/cancel", auth, requireRole("customer"), requestController.cancelRequest);
router.post("/:id/complete", auth, requestController.completeRequest);
router.post("/:id/settle-commission", auth, requireRole("mechanic", "admin"), requestController.settleCommission);
router.post("/:id/status", auth, requestController.updateStatus);

module.exports = router;
