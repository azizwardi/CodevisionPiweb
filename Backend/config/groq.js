const Groq = require("groq-sdk");

// Initialiser le client GROQ avec la clé API
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, // Utilise la clé API GROQ déjà définie dans .env
});

module.exports = groq;
