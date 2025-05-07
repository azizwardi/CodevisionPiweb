const express = require("express");
const {
  getAllQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizQuestions,
  publishQuiz
} = require("../controllers/quizController");

const router = express.Router();

// Quiz routes
router.get("/", getAllQuizzes);
router.get("/:quizId", getQuizById);
router.post("/", createQuiz);
router.put("/:quizId", updateQuiz);
router.delete("/:quizId", deleteQuiz);
router.post("/:quizId/publish", publishQuiz);

// Question routes
router.get("/:quizId/questions", getQuizQuestions);
router.post("/:quizId/questions", addQuestion);
router.put("/questions/:questionId", updateQuestion);
router.delete("/questions/:questionId", deleteQuestion);

module.exports = router;
