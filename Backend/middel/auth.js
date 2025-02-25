const jwt = require("jsonwebtoken");
const { checkBlacklist } = require("../routes/auth");

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Accès refusé" });

  if (checkBlacklist(token)) {
    return res
      .status(401)
      .json({ message: "Session expirée, reconnectez-vous" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = authenticateToken;
