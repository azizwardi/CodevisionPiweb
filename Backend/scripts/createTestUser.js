const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
require('dotenv').config();

// Connexion à MongoDB
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/piweb";
console.log("Connecting to MongoDB with URI:", mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    
    try {
      // Vérifier si l'utilisateur de test existe déjà
      const existingUser = await User.findOne({ email: 'test@example.com' });
      
      if (existingUser) {
        console.log('L\'utilisateur de test existe déjà');
      } else {
        // Créer un mot de passe hashé
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Créer un nouvel utilisateur
        const newUser = new User({
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
          isVerified: true
        });
        
        // Sauvegarder l'utilisateur
        await newUser.save();
        console.log('Utilisateur de test créé avec succès');
      }
      
      // Afficher tous les utilisateurs
      const users = await User.find();
      console.log('Utilisateurs dans la base de données:');
      users.forEach(user => {
        console.log(`- ${user.username} (${user.email}), ID: ${user._id}`);
      });
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      // Fermer la connexion
      mongoose.connection.close();
    }
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));
