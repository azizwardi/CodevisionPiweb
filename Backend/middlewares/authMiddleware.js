const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Importer le modèle utilisateur

// Middleware pour vérifier le rôle de l'utilisateur
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Accès interdit" });
      }

      next(); // Passer à la suite si le rôle est valide
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
};

module.exports = { checkRole };
