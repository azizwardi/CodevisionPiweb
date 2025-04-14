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

const passport = require("passport");
require("./auth"); // Importe la configuration de Passport depuis auth.js

const app = express();
const PORT = process.env.PORT || 8000; // Utilise 8000 comme fallback si PORT n'est pas défini

// Middleware
app.use(express.json());
app.use(cookieParser());

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

// Session configuration - MUST be before Passport initialization
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 180 * 60 * 1000 }, // 3 hours
  })
);

// Passport initialization - MUST be after session middleware
app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", user);

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
        $or: [{ googleId: req.user.id }, { email: req.user.email }]
      });

      if (!user) {
        // Create new user without setting a default role
        user = await User.create({
          googleId: req.user.id,
          displayName: req.user.displayName,
          email: req.user.email,
          firstName: req.user.name.givenName,
          lastName: req.user.name.familyName,
          role: '',  // Leave role empty to trigger role selection
          username: req.user.email.split('@')[0],
          password: 'default',
          isVerified: true  // Keep Google users verified
        });
      } else {
        // Ensure the user is marked as verified since they authenticated with Google
        if (!user.isVerified) {
          user.isVerified = true;
          await user.save();
        }

        // Update googleId if it's missing
        if (!user.googleId) {
          user = await User.findOneAndUpdate(
            { email: req.user.email },
            { googleId: req.user.id },
            { new: true }
          );
          console.log("Updated existing user with Google ID");
        }
      }

      // Create token with additional information for admin users
      console.log("User object before signing JWT:", user);

      const token = jwt.sign(
        {
          id: user.id,
          name: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          // Add a flag to indicate this is a Google auth user
          googleAuth: true
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.redirect(`http://localhost:5173/auth/success?token=${encodeURIComponent(token)}`);
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

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codevisionpiweb';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
