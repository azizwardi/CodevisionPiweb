require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoutes');
const user = require('./routes/user');
const cookieParser = require('cookie-parser');
const path = require('path');
const User = require('./models/User');

const passport = require('passport');
require('./auth'); // Importe la configuration de Passport depuis auth.js

const app = express();
const PORT = process.env.PORT || 8000; // Utilise 8000 comme fallback si PORT n'est pas défini

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const jwt = require("jsonwebtoken");


//Routes
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());


// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } // 3 hours
}));


// Middleware pour vérifier si l'utilisateur est connecté
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'], prompt: "select_account" })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/google/failure' }),
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
        console.log("User not found, updating existing user or creating a new one.");

        user = await User.findOneAndUpdate(
          { email: req.user.email },  // Find the user by email if they exist
          { googleId: req.user.id },  // Update googleId if missing
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
            role: 'admin',  
            username: req.user.email.split('@')[0], 
            password: 'default', 
          });
        }
      }
      console.log("User object before signing JWT:", user);


      const token = jwt.sign(
        { id: user.id, name: user.username, email: user.email,firstName: user.firstName,lastName: user.lastName, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const decodedToken = jwt.decode(token);
      console.log("Decoded Token:", decodedToken);


      res.redirect(`http://localhost:5173/auth/success?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error("Error handling Google authentication:", error);
      res.redirect("http://localhost:5173/signin?error=server-error");
    }
  }
);



app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});


app.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate.');
});

app.get('/protected', isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.displayName}`);
});

app.get('/logout', (req, res, next) => {
  req.logout(function (err) {
    if (err) { return next(err); }
    req.session.destroy();
    res.send('Goodbye!');
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', user);

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));