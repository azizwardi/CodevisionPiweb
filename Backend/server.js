require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRoutes = require("./routes/authRoutes");
const user = require("./routes/user");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const User = require("./models/user");
const projectRouter = require("./routes/projectRoutes");
const eventRouter = require("./routes/eventRoutes");
const commentRouter = require("./routes/commentRoutes");
const http = require("http");
const { Server } = require("socket.io");

const passport = require("passport");
require("./auth"); // Importe la configuration de Passport depuis auth.js

const app = express();
const PORT = process.env.PORT || 8000; // Utilise 8000 comme fallback si PORT n'est pas défini

// Middleware
app.use(express.json());

// Configuration CORS pour permettre l'accès aux images
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

// Désactiver certaines protections Helmet pour les images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cookieParser());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, "public", "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const jwt = require("jsonwebtoken");

//Routes
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    // Utiliser une session en mémoire temporairement pour le débogage
    // store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 }, // 3 hours
  })
);

// Middleware pour vérifier si l'utilisateur est connecté
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// Routes
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    prompt: "select_account",
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  async (req, res) => {
    if (!req.user) {
      console.log("User not authenticated");
      return res.redirect("http://localhost:5173/signin?error=unauthorized");
    }

    try {
      let user = await User.findOne({
        $or: [{ googleId: req.user.id }, { email: req.user.email }],
      });

      if (!user) {
        console.log(
          "User not found, updating existing user or creating a new one."
        );

        user = await User.findOneAndUpdate(
          { email: req.user.email }, // Find the user by email if they exist
          { googleId: req.user.id }, // Update googleId if missing
          { new: true } // Return updated user
        );

        // If no user exists with this email, create a new one
        if (!user) {
          user = await User.create({
            googleId: req.user.id,
            displayName: req.user.displayName,
            email: req.user.email,
            firstName: req.user.name.givenName,
            lastName: req.user.name.familyName,
            role: "admin",
            username: req.user.email.split("@")[0],
            password: "default",
          });
        }
      }
      console.log("User object before signing JWT:", user);

      const token = jwt.sign(
        {
          id: user.id,
          name: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const decodedToken = jwt.decode(token);
      console.log("Decoded Token:", decodedToken);

      res.redirect(
        `http://localhost:5173/auth/success?token=${encodeURIComponent(token)}`
      );
    } catch (error) {
      console.error("Error handling Google authentication:", error);
      res.redirect("http://localhost:5173/signin?error=server-error");
    }
  }
);

app.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/auth/google/failure", (req, res) => {
  res.send("Failed to authenticate.");
});

app.get("/protected", isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.displayName}`);
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy();
    res.send("Goodbye!");
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", user);
app.use("/projects", projectRouter);
app.use("/events", eventRouter);
app.use("/comments", commentRouter);

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
});

// Make io accessible globally
global.io = io;

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Socket.IO: Nouvelle connexion établie avec ID:", socket.id);

  // Envoyer immédiatement un message de test pour confirmer que la connexion fonctionne
  socket.emit('connectionTest', {
    message: 'Connexion Socket.IO établie avec succès',
    timestamp: new Date().toISOString(),
    socketId: socket.id
  });

  // Listen for notifications
  socket.on("joinUser", (userId) => {
    if (userId) {
      // Stocker l'ID utilisateur dans l'objet socket pour référence future
      socket.userId = userId;

      // Rejoindre la room personnelle de l'utilisateur
      socket.join(`user_${userId}`);
      console.log(`Socket.IO: User ${userId} joined their personal room: user_${userId}`);

      // Envoyer un message de confirmation
      socket.emit('connectionTest', {
        message: `Room utilisateur rejointe avec succès: user_${userId}`,
        timestamp: new Date().toISOString(),
        userId: userId
      });

      // Envoyer une notification de test pour vérifier que tout fonctionne
      setTimeout(() => {
        socket.emit("memberAdded", {
          type: "test_notification",
          message: "Notification de test - Si vous voyez ceci, les notifications fonctionnent!",
          timestamp: new Date().toISOString(),
          userId: userId,
          targetUserId: userId,
          forUserId: userId
        });
        console.log(`Socket.IO: Notification de test envoyée à l'utilisateur ${userId}`);
      }, 2000);
    } else {
      console.log("Socket.IO: User tried to join a room without providing a userId");
    }
  });

  // Ajouter un gestionnaire d'événements pour tester la connexion
  socket.on("testConnection", (data) => {
    console.log("Socket.IO: Test de connexion reçu:", data);
    socket.emit("testConnectionResponse", {
      message: "Test de connexion réussi",
      receivedData: data,
      timestamp: new Date().toISOString(),
      socketId: socket.id,
      userId: socket.userId || 'non défini'
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO: User disconnected:", socket.id, socket.userId ? `(userId: ${socket.userId})` : '');
  });

  socket.on("error", (error) => {
    console.error("Socket.IO: Error event:", error);
  });
});

// Log when Socket.IO server is ready
io.engine.on("connection_error", (err) => {
  console.error("Socket.IO: Connection error:", err.req, err.code, err.message, err.context);
});

console.log("Socket.IO server initialized and waiting for connections");

// Start the Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/piweb";
console.log("Connecting to MongoDB with URI:", mongoUri);
mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
