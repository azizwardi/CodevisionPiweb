const express = require("express");
const router = express.Router();



let tokenBlacklist = [];


router.post("/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token manquant" });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    tokenBlacklist.push(token); // Ajouter le token à la liste noire

    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    res.status(400).json({ message: "Token invalide" });
  }
});

// Middleware pour bloquer les tokens invalidés
const checkBlacklist = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (tokenBlacklist.includes(token)) {
    return res.status(401).json({ message: "Token invalide, reconnectez-vous" });
  }
  next();
};

module.exports = { router, checkBlacklist };