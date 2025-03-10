const jwt = require("jsonwebtoken");
const User = require("../models/User");


const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Accès non autorisé" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalide" });
    }
};


const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "Non authentifié" });
            }

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: "Accès interdit" });
            }

            next();
        } catch (error) {
            res.status(500).json({ message: "Erreur serveur" });
        }
    };
};

module.exports = { authenticateUser, checkRole };
