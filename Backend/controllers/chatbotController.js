const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Task = require("../models/task");
const groqService = require("../services/groqService");

/**
 * Crée une nouvelle conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const { userId, projectId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    const conversation = new Conversation({
      user: userId,
      project: projectId || null,
      title: title || "Nouvelle conversation"
    });

    const savedConversation = await conversation.save();
    res.status(201).json({ 
      message: "Conversation créée avec succès", 
      conversation: savedConversation 
    });
  } catch (error) {
    console.error("Erreur lors de la création de la conversation:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création de la conversation", 
      error: error.message 
    });
  }
};

/**
 * Récupère toutes les conversations d'un utilisateur
 */
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    const conversations = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate("project", "name");

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des conversations", 
      error: error.message 
    });
  }
};

/**
 * Récupère une conversation par son ID
 */
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: "L'ID de la conversation est requis" });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("user", "username firstName lastName avatarUrl")
      .populate("project", "name");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("task", "title");

    res.status(200).json({ conversation, messages });
  } catch (error) {
    console.error("Erreur lors de la récupération de la conversation:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de la conversation", 
      error: error.message 
    });
  }
};

/**
 * Envoie un message et génère une réponse
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, taskId } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ 
        message: "L'ID de la conversation et le contenu du message sont requis" 
      });
    }

    // Vérifier si la conversation existe
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    // Créer et sauvegarder le message de l'utilisateur
    const userMessage = new Message({
      conversation: conversationId,
      content,
      role: "user",
      task: taskId || null
    });
    await userMessage.save();

    // Mettre à jour la date de la dernière mise à jour de la conversation
    conversation.updatedAt = new Date();
    await conversation.save();

    // Récupérer l'historique des messages pour le contexte
    const messageHistory = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .limit(10); // Limiter à 10 messages pour éviter de dépasser les limites de tokens

    // Formater les messages pour l'API Groq
    const formattedMessages = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Ajouter un message système pour donner du contexte à l'IA
    formattedMessages.unshift({
      role: "system",
      content: "Tu es un assistant IA spécialisé dans l'aide aux développeurs. Tu aides à résoudre des problèmes liés à des tâches de développement. Fournis des réponses précises, utiles et pertinentes."
    });

    // Si un taskId est fourni, ajouter des informations sur la tâche
    let task = null;
    if (taskId) {
      task = await Task.findById(taskId);
      if (task) {
        formattedMessages[0].content += `\nVoici les détails de la tâche sur laquelle l'utilisateur travaille :\n\nTitre: ${task.title}\nDescription: ${task.description || "Aucune description fournie"}\nStatut: ${task.status}\nDate d'échéance: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Non spécifiée"}`;
      }
    }

    // Générer une réponse avec l'API Groq
    const groqResponse = await groqService.generateResponse(formattedMessages);
    const assistantResponseContent = groqResponse.choices[0].message.content;

    // Créer et sauvegarder la réponse de l'assistant
    const assistantMessage = new Message({
      conversation: conversationId,
      content: assistantResponseContent,
      role: "assistant",
      task: taskId || null
    });
    await assistantMessage.save();

    res.status(200).json({ 
      userMessage, 
      assistantMessage 
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    res.status(500).json({ 
      message: "Erreur lors de l'envoi du message", 
      error: error.message 
    });
  }
};

/**
 * Génère une aide pour une tâche spécifique
 */
exports.getTaskHelp = async (req, res) => {
  try {
    const { taskId, query } = req.body;

    if (!taskId || !query) {
      return res.status(400).json({ 
        message: "L'ID de la tâche et la question sont requis" 
      });
    }

    // Récupérer les détails de la tâche
    const task = await Task.findById(taskId)
      .populate("assignedTo", "username")
      .populate("projectId", "name");

    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    // Générer une réponse d'aide pour la tâche
    const response = await groqService.generateTaskHelp(task, query);

    res.status(200).json({ response });
  } catch (error) {
    console.error("Erreur lors de la génération de l'aide pour la tâche:", error);
    res.status(500).json({ 
      message: "Erreur lors de la génération de l'aide pour la tâche", 
      error: error.message 
    });
  }
};

/**
 * Supprime une conversation
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: "L'ID de la conversation est requis" });
    }

    // Vérifier si la conversation existe
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    // Supprimer tous les messages associés à la conversation
    await Message.deleteMany({ conversation: conversationId });

    // Supprimer la conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Conversation supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la conversation:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la conversation", 
      error: error.message 
    });
  }
};
