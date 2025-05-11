const Groq = require("groq-sdk");
require("dotenv").config(); // Ensure dotenv is loaded here

// Get the API key directly from the .env file
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";

// Log for debugging
console.log("GROQ API Key:", GROQ_API_KEY ? "Key is set" : "Key is missing");

// Initialiser le client GROQ avec la clé API
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

module.exports = groq;
