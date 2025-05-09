const Certificate = require('../models/certificate');
const User = require('../models/user');
const Quiz = require('../models/quiz');
const QuizAttempt = require('../models/quizAttempt');

// Générer un certificat pour un utilisateur qui a obtenu un score parfait
exports.generateCertificate = async (req, res) => {
  try {
    const { userId, quizId, attemptId } = req.body;

    // Vérifier si l'utilisateur et le quiz existent
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    // Vérifier si la tentative existe et a un score parfait
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Tentative de quiz non trouvée" });
    }

    // Vérifier si le score est parfait (100%)
    const isPerfectScore = attempt.score === attempt.maxScore;
    if (!isPerfectScore) {
      return res.status(400).json({ 
        message: "Le certificat ne peut être généré que pour un score parfait",
        score: attempt.score,
        maxScore: attempt.maxScore
      });
    }

    // Vérifier si un certificat existe déjà pour ce quiz et cet utilisateur
    const existingCertificate = await Certificate.findOne({
      user: userId,
      quiz: quizId
    });

    if (existingCertificate) {
      return res.status(200).json({ 
        message: "Un certificat existe déjà pour ce quiz",
        certificate: existingCertificate
      });
    }

    // Générer un ID de certificat unique
    const certificateId = Certificate.generateCertificateId();

    // Créer le certificat
    const certificate = new Certificate({
      user: userId,
      quiz: quizId,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: Math.round((attempt.score / attempt.maxScore) * 100),
      isPerfectScore: true,
      certificateId: certificateId,
      // L'URL du certificat sera générée côté frontend
      certificateUrl: `/certificates/${certificateId}`
    });

    // Sauvegarder le certificat
    const savedCertificate = await certificate.save();

    // Mettre à jour le grade de l'utilisateur
    // Compter le nombre de certificats parfaits que l'utilisateur a obtenus
    const perfectCertificatesCount = await Certificate.countDocuments({
      user: userId,
      isPerfectScore: true
    });

    // Déterminer le nouveau grade en fonction du nombre de certificats
    let newGrade = user.grade || 'Débutant';
    if (perfectCertificatesCount >= 5) {
      newGrade = 'Expert';
    } else if (perfectCertificatesCount >= 3) {
      newGrade = 'Avancé';
    } else if (perfectCertificatesCount >= 1) {
      newGrade = 'Intermédiaire';
    }

    // Mettre à jour le grade de l'utilisateur si nécessaire
    if (newGrade !== user.grade) {
      user.grade = newGrade;
      await user.save();
    }

    // Renvoyer le certificat et le nouveau grade
    res.status(201).json({
      message: "Certificat généré avec succès",
      certificate: savedCertificate,
      newGrade: newGrade,
      oldGrade: user.grade !== newGrade ? user.grade : null,
      gradeUpgraded: user.grade !== newGrade
    });
  } catch (error) {
    console.error("Erreur lors de la génération du certificat:", error);
    res.status(500).json({ message: "Erreur lors de la génération du certificat", error: error.message });
  }
};

// Obtenir tous les certificats d'un utilisateur
exports.getUserCertificates = async (req, res) => {
  try {
    const { userId } = req.params;

    const certificates = await Certificate.find({ user: userId })
      .populate('quiz', 'title description category')
      .sort({ issueDate: -1 });

    res.status(200).json(certificates);
  } catch (error) {
    console.error("Erreur lors de la récupération des certificats:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des certificats", error: error.message });
  }
};

// Obtenir un certificat par son ID
exports.getCertificateById = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate('user', 'username email firstName lastName')
      .populate('quiz', 'title description category');

    if (!certificate) {
      return res.status(404).json({ message: "Certificat non trouvé" });
    }

    res.status(200).json(certificate);
  } catch (error) {
    console.error("Erreur lors de la récupération du certificat:", error);
    res.status(500).json({ message: "Erreur lors de la récupération du certificat", error: error.message });
  }
};
