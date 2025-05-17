const axios = require("axios");
require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

class GroqService {
  async generateResponse(messages, options = {}) {
    try {
      const defaultOptions = {
        model: "llama3-70b-8192",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false,
        messages
      };

      const requestOptions = { ...defaultOptions, ...options };

      const response = await axios.post(GROQ_API_URL, requestOptions, {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la génération de la réponse Groq:", error.response?.data || error.message);
      throw error;
    }
  }

  async generateTaskHelp(task, userQuery) {
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant specialized in project management, task organization, and team performance. You help users complete their tasks efficiently. Here is the task:

        - Title: ${task.title}
        - Description: ${task.description || "No description"}
        - Status: ${task.status}
        - Due Date: ${task.dueDate || "Not specified"}

        Help me accomplish this task efficiently, providing guidance on project management best practices and workflow optimization.`,
      },
      {
        role: "user",
        content: userQuery,
      },
    ];

    const response = await this.generateResponse(messages);
    return response.choices[0].message.content;
  }
}

module.exports = new GroqService();
