const QuizAttempt = require("../models/quizAttempt");
const Quiz = require("../models/quiz");
const QuizQuestion = require("../models/quizQuestion");
const certificateController = require("./certificateController");

// Démarrer une tentative de quiz
exports.startQuizAttempt = async (req, res) => {
  try {
    const { quizId, userId } = req.body;

    // Vérifier si le quiz existe
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Vérifier si l'utilisateur a déjà une tentative en cours pour ce quiz
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quizId,
      user: userId,
      completed: false
    });

    if (existingAttempt) {
      return res.status(200).json({
        message: "Quiz attempt already in progress",
        attempt: existingAttempt
      });
    }

    // Créer une nouvelle tentative
    const quizAttempt = new QuizAttempt({
      quiz: quizId,
      user: userId,
      answers: [],
      startedAt: new Date()
    });

    const savedAttempt = await quizAttempt.save();
    res.status(201).json({
      message: "Quiz attempt started successfully",
      attempt: savedAttempt
    });
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    res.status(500).json({ message: "Error starting quiz attempt", error: error.message });
  }
};

// Soumettre une réponse à une question
exports.submitAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedOption, textAnswer } = req.body;

    // Vérifier si la tentative existe
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Vérifier si la tentative est déjà terminée
    if (attempt.completed) {
      return res.status(400).json({ message: "Quiz attempt already completed" });
    }

    // Vérifier si la question existe
    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Déterminer si la réponse est correcte
    let isCorrect = false;

    if (question.questionType === "multiple-choice") {
      // Pour les questions à choix multiple
      const selectedOptionIndex = parseInt(selectedOption);
      isCorrect = question.options[selectedOptionIndex]?.isCorrect || false;
    } else if (question.questionType === "true-false") {
      // Pour les questions vrai/faux
      isCorrect = selectedOption === question.correctAnswer;
    } else if (question.questionType === "short-answer") {
      // Pour les questions à réponse courte, comparer en ignorant la casse
      isCorrect = textAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    }

    // Vérifier si la question a déjà été répondue
    const existingAnswerIndex = attempt.answers.findIndex(
      answer => answer.question.toString() === questionId
    );

    if (existingAnswerIndex !== -1) {
      // Mettre à jour la réponse existante
      attempt.answers[existingAnswerIndex] = {
        question: questionId,
        selectedOption,
        textAnswer,
        isCorrect
      };
    } else {
      // Ajouter une nouvelle réponse
      attempt.answers.push({
        question: questionId,
        selectedOption,
        textAnswer,
        isCorrect
      });
    }

    const savedAttempt = await attempt.save();
    res.status(200).json({
      message: "Answer submitted successfully",
      isCorrect,
      attempt: savedAttempt
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Error submitting answer", error: error.message });
  }
};

// Terminer une tentative de quiz et calculer le score
exports.completeQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Vérifier si la tentative existe
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    // Vérifier si la tentative est déjà terminée
    if (attempt.completed) {
      return res.status(400).json({ message: "Quiz attempt already completed" });
    }

    // Récupérer toutes les questions du quiz
    const quiz = await Quiz.findById(attempt.quiz);
    const questions = await QuizQuestion.find({ quiz: attempt.quiz });

    // Calculer le score maximum possible
    const maxScore = questions.reduce((total, question) => total + question.points, 0);

    // Calculer le score obtenu
    let score = 0;
    for (const answer of attempt.answers) {
      if (answer.isCorrect) {
        const question = questions.find(q => q._id.toString() === answer.question.toString());
        if (question) {
          score += question.points;
        }
      }
    }

    // Mettre à jour la tentative
    attempt.score = score;
    attempt.maxScore = maxScore;
    attempt.completed = true;
    attempt.completedAt = new Date();

    const savedAttempt = await attempt.save();

    // Calculer le pourcentage
    const percentage = Math.round((score / maxScore) * 100);

    // Vérifier si l'utilisateur a obtenu un score parfait (100%)
    let certificateInfo = null;
    if (score === maxScore && maxScore > 0) {
      try {
        console.log("Score parfait détecté, génération d'un certificat...");

        // Créer un objet de requête et de réponse pour appeler la fonction de génération de certificat
        const req = {
          body: {
            userId: attempt.user,
            quizId: attempt.quiz,
            attemptId: attempt._id
          }
        };

        // Créer un objet de réponse simulé
        const res = {
          status: function(statusCode) {
            this.statusCode = statusCode;
            return this;
          },
          json: function(data) {
            this.data = data;
            return this;
          }
        };

        // Appeler directement la fonction de génération de certificat
        await certificateController.generateCertificate(req, res);

        // Vérifier si le certificat a été généré avec succès
        if (res.statusCode === 201 && res.data) {
          certificateInfo = {
            certificate: res.data.certificate,
            newGrade: res.data.newGrade,
            oldGrade: res.data.oldGrade,
            gradeUpgraded: res.data.gradeUpgraded
          };

          console.log("Certificat généré avec succès:", certificateInfo);
        }
      } catch (certError) {
        console.error("Erreur lors de la génération du certificat:", certError);
        // Ne pas bloquer la complétion du quiz si la génération du certificat échoue
      }
    }

    res.status(200).json({
      message: "Quiz attempt completed successfully",
      attempt: savedAttempt,
      score,
      maxScore,
      percentage,
      certificateInfo
    });
  } catch (error) {
    console.error("Error completing quiz attempt:", error);
    res.status(500).json({ message: "Error completing quiz attempt", error: error.message });
  }
};

// Obtenir les détails d'une tentative de quiz
exports.getQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findById(attemptId)
      .populate("quiz")
      .populate("user", "username email")
      .populate("answers.question");

    if (!attempt) {
      return res.status(404).json({ message: "Quiz attempt not found" });
    }

    res.status(200).json(attempt);
  } catch (error) {
    console.error("Error retrieving quiz attempt:", error);
    res.status(500).json({ message: "Error retrieving quiz attempt", error: error.message });
  }
};

// Obtenir toutes les tentatives d'un utilisateur
exports.getUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;

    const attempts = await QuizAttempt.find({ user: userId })
      .populate("quiz", "title description category")
      .sort({ startedAt: -1 });

    res.status(200).json(attempts);
  } catch (error) {
    console.error("Error retrieving user attempts:", error);
    res.status(500).json({ message: "Error retrieving user attempts", error: error.message });
  }
};

// Vérifier si un utilisateur a déjà complété un quiz
exports.checkUserCompletedQuiz = async (req, res) => {
  try {
    const { userId, quizId } = req.params;
    console.log(`Checking if user ${userId} has completed quiz ${quizId}`);

    // Rechercher une tentative complétée pour ce quiz et cet utilisateur
    const attempt = await QuizAttempt.findOne({
      user: userId,
      quiz: quizId,
      completed: true
    });

    // Si une tentative est trouvée, l'utilisateur a déjà complété ce quiz
    const hasCompleted = !!attempt;

    // Si une tentative est trouvée, renvoyer également le score
    const score = attempt ? {
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: Math.round((attempt.score / attempt.maxScore) * 100),
      completedAt: attempt.completedAt,
      attemptId: attempt._id
    } : null;

    console.log(`User ${userId} has ${hasCompleted ? 'already' : 'not'} completed quiz ${quizId}`);

    res.status(200).json({
      hasCompleted,
      score
    });
  } catch (error) {
    console.error("Error checking if user completed quiz:", error);
    res.status(500).json({ message: "Error checking if user completed quiz", error: error.message });
  }
};
