const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Task = require("../models/task");
const groqService = require("../services/groqService");

/**
 * Creates a new conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const { userId, projectId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const conversation = new Conversation({
      user: userId,
      project: projectId || null,
      title: title || "New conversation"
    });

    const savedConversation = await conversation.save();
    res.status(201).json({
      message: "Conversation created successfully",
      conversation: savedConversation
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({
      message: "Error creating conversation",
      error: error.message
    });
  }
};

/**
 * Gets all conversations for a user
 */
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const conversations = await Conversation.find({ user: userId })
      .sort({ updatedAt: -1 })
      .populate("project", "name");

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error retrieving conversations:", error);
    res.status(500).json({
      message: "Error retrieving conversations",
      error: error.message
    });
  }
};

/**
 * Gets a conversation by its ID
 */
exports.getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("user", "username firstName lastName avatarUrl")
      .populate("project", "name");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("task", "title");

    res.status(200).json({ conversation, messages });
  } catch (error) {
    console.error("Error retrieving conversation:", error);
    res.status(500).json({
      message: "Error retrieving conversation",
      error: error.message
    });
  }
};

/**
 * Sends a message and generates a response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, taskId } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        message: "Conversation ID and message content are required"
      });
    }

    // Check if the conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Create and save the user message
    const userMessage = new Message({
      conversation: conversationId,
      content,
      role: "user",
      task: taskId || null
    });
    await userMessage.save();

    // Update the conversation's last update date
    conversation.updatedAt = new Date();

    // Check if this is the first message in the conversation and update the title
    const messageCount = await Message.countDocuments({ conversation: conversationId });
    if (messageCount <= 1 && conversation.title === "New conversation") {
      // Generate a title based on the first message content
      const titlePrompt = [
        {
          role: "system",
          content: "You are a helpful assistant that generates short, descriptive titles (max 5 words) based on user messages. The title should reflect the topic or intent of the message."
        },
        {
          role: "user",
          content: `Generate a short, descriptive title (max 5 words) for a conversation that starts with this message: "${content}"`
        }
      ];

      try {
        const titleResponse = await groqService.generateResponse(titlePrompt);
        const generatedTitle = titleResponse.choices[0].message.content.replace(/"/g, '').trim();
        conversation.title = generatedTitle;
        console.log("Generated conversation title:", generatedTitle);
      } catch (titleError) {
        console.error("Error generating title:", titleError);
        // If title generation fails, use a substring of the message
        conversation.title = content.length > 30 ? `${content.substring(0, 30)}...` : content;
      }
    }

    await conversation.save();

    // Retrieve message history for context
    const messageHistory = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .limit(10); // Limit to 10 messages to avoid exceeding token limits

    // Format messages for the Groq API
    const formattedMessages = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add a system message to provide context to the AI
    formattedMessages.unshift({
      role: "system",
      content: "You are an AI assistant specialized in project management, task organization, and team performance. You help users manage their projects, optimize workflows, track tasks, and improve team productivity. Provide accurate, helpful, and relevant responses in English only."
    });

    // If a taskId is provided, add information about the task
    let task = null;
    if (taskId) {
      task = await Task.findById(taskId);
      if (task) {
        formattedMessages[0].content += `\nHere are the details of the task the user is working on:\n\nTitle: ${task.title}\nDescription: ${task.description || "No description provided"}\nStatus: ${task.status}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not specified"}`;
      }
    }

    // Generate a response with the Groq API
    const groqResponse = await groqService.generateResponse(formattedMessages);
    const assistantResponseContent = groqResponse.choices[0].message.content;

    // Create and save the assistant's response
    const assistantMessage = new Message({
      conversation: conversationId,
      content: assistantResponseContent,
      role: "assistant",
      task: taskId || null
    });
    await assistantMessage.save();

    res.status(200).json({
      userMessage,
      assistantMessage,
      conversationTitle: conversation.title // Return the updated title
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Error sending message",
      error: error.message
    });
  }
};

/**
 * Generates help for a specific task
 */
exports.getTaskHelp = async (req, res) => {
  try {
    const { taskId, query } = req.body;

    if (!taskId || !query) {
      return res.status(400).json({
        message: "Task ID and query are required"
      });
    }

    // Retrieve task details
    const task = await Task.findById(taskId)
      .populate("assignedTo", "username")
      .populate("projectId", "name");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Generate a help response for the task
    const response = await groqService.generateTaskHelp(task, query);

    res.status(200).json({ response });
  } catch (error) {
    console.error("Error generating task help:", error);
    res.status(500).json({
      message: "Error generating task help",
      error: error.message
    });
  }
};

/**
 * Deletes a conversation
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    // Check if the conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Delete all messages associated with the conversation
    await Message.deleteMany({ conversation: conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({
      message: "Error deleting conversation",
      error: error.message
    });
  }
};
