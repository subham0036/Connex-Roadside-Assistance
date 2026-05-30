const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");

router.post("/:requestId/video/signal", auth, chatController.postVideoSignal);
router.get("/:requestId/video/signals", auth, chatController.getVideoSignals);
router.delete("/:requestId/video/signals", auth, chatController.clearVideoSignals);
router.get("/:requestId", auth, chatController.getMessages);
router.post("/:requestId", auth, chatController.sendMessage);

module.exports = router;
