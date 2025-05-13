const express = require("express");
const {
  getTeamMessages,
  sendMessage,
  markMessagesAsRead
} = require("../controllers/teamChatController");

const router = express.Router();

// Get all messages for a team
router.get("/:teamId/messages", getTeamMessages);

// Send a new message
router.post("/messages", sendMessage);

// Mark messages as read
router.put("/:teamId/messages/read", markMessagesAsRead);

module.exports = router;
