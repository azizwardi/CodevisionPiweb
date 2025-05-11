const faceVerificationService = require('../services/faceVerificationService');
const User = require('../models/user');
const Quiz = require('../models/quiz');

/**
 * Contrôleur pour la vérification faciale
 */
exports.verifyIdentity = async (req, res) => {
  try {
    // Mode test pour faciliter le développement
    // Si FACE_VERIFICATION_TEST_MODE est défini à 'true' dans .env, on retourne toujours verified: true
    if (process.env.FACE_VERIFICATION_TEST_MODE === 'true') {
      console.log('Mode test activé : vérification faciale automatiquement réussie');
      return res.status(200).json({ verified: true });
    }

    const { userId, quizId, faceImage } = req.body;

    // Vérifier si l'image est bien fournie
    if (!faceImage) {
      return res.status(400).json({
        message: 'Image faciale manquante',
        verified: false
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé',
        verified: false
      });
    }

    // Vérifier si le quiz existe
    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          message: 'Quiz non trouvé',
          verified: false
        });
      }
    }

    console.log(`Tentative de vérification faciale pour l'utilisateur ${userId}`);

    // Vérifier l'identité de l'utilisateur
    const verified = await faceVerificationService.verifyIdentity(userId, faceImage);

    // Enregistrer la vérification dans l'historique (à implémenter si nécessaire)
    console.log(`Résultat de la vérification faciale: ${verified ? 'Réussie' : 'Échouée'}`);

    res.status(200).json({ verified });
  } catch (error) {
    console.error('Erreur détaillée lors de la vérification de l\'identité:', error);

    // Envoyer une réponse plus détaillée
    res.status(500).json({
      message: `Erreur lors de la vérification de l'identité: ${error.message}`,
      error: error.message,
      verified: false,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Enregistrer un visage de référence
 */
exports.registerFace = async (req, res) => {
  try {
    const { userId, faceImage } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Enregistrer le visage
    const registered = await faceVerificationService.registerFace(userId, faceImage);

    res.status(200).json({
      message: 'Visage enregistré avec succès',
      registered
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du visage:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'enregistrement du visage',
      error: error.message
    });
  }
};
