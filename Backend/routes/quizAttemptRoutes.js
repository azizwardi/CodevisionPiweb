const express = require("express");
const {
  startQuizAttempt,
  submitAnswer,
  completeQuizAttempt,
  getQuizAttempt,
  getUserAttempts,
  checkUserCompletedQuiz
} = require("../controllers/quizAttemptController");

const router = express.Router();

// Routes pour les tentatives de quiz
router.post("/start", startQuizAttempt);
router.post("/submit-answer", submitAnswer);
router.post("/complete/:attemptId", completeQuizAttempt);
router.get("/check/:userId/:quizId", checkUserCompletedQuiz);
router.get("/user/:userId", getUserAttempts);
router.get("/:attemptId", getQuizAttempt);

module.exports = router;
