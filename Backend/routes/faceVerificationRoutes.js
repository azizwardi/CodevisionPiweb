const express = require('express');
const router = express.Router();
const faceVerificationController = require('../controllers/faceVerificationController');

// Route pour vérifier l'identité d'un utilisateur
router.post('/verify', faceVerificationController.verifyIdentity);

// Route pour enregistrer un visage de référence
router.post('/register', faceVerificationController.registerFace);

module.exports = router;
