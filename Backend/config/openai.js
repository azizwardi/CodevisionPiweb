const { OpenAI } = require('openai');

// Initialiser le client OpenAI avec la clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Assurez-vous d'avoir défini cette variable d'environnement
});

module.exports = openai;
