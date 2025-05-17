const express = require("express");
const {
  createConversation,
  getUserConversations,
  getConversationById,
  sendMessage,
  getTaskHelp,
  deleteConversation
} = require("../controllers/chatbotController");

const router = express.Router();

// Create a new conversation
router.post("/conversations", createConversation);

// Get all conversations for a user
router.get("/conversations/user/:userId", getUserConversations);

// Get a conversation by its ID
router.get("/conversations/:conversationId", getConversationById);

// Send a message and get a response
router.post("/messages", sendMessage);

// Get help for a specific task
router.post("/task-help", getTaskHelp);

// Delete a conversation
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
