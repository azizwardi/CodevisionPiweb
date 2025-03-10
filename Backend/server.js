require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('./auth'); // Importe la configuration de Passport depuis auth.js

const app = express();
const PORT = process.env.PORT || 8000; // Utilise 8000 comme fallback si PORT n'est pas défini

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS
app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Middleware pour vérifier si l'utilisateur est connecté
function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// Routes
app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'], prompt: "select_account" })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/google/failure'
  })
);

app.get('/auth/google/failure', (req, res) => {
  res.send('Failed to authenticate..');
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

// Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));