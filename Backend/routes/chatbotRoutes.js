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

// Créer une nouvelle conversation
router.post("/conversations", createConversation);

// Récupérer toutes les conversations d'un utilisateur
router.get("/conversations/user/:userId", getUserConversations);

// Récupérer une conversation par son ID
router.get("/conversations/:conversationId", getConversationById);

// Envoyer un message et obtenir une réponse
router.post("/messages", sendMessage);

// Obtenir de l'aide pour une tâche spécifique
router.post("/task-help", getTaskHelp);

// Supprimer une conversation
router.delete("/conversations/:conversationId", deleteConversation);

module.exports = router;
