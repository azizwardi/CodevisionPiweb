const Quiz = require("../models/quiz");
const QuizQuestion = require("../models/quizQuestion");

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("creator", "username email");
    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    res.status(500).json({ message: "Error retrieving quizzes", error: error.message });
  }
};

// Get quiz by ID
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate("creator", "username email")
      .populate("questions");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Error retrieving quiz:", error);
    res.status(500).json({ message: "Error retrieving quiz", error: error.message });
  }
};

// Create a new quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, creator } = req.body;

    if (!title || !description || !category || !creator) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["title", "description", "category", "creator"]
      });
    }

    const quiz = new Quiz({
      title,
      description,
      category,
      creator,
      questions: []
    });

    const savedQuiz = await quiz.save();
    res.status(201).json({ message: "Quiz created successfully", quiz: savedQuiz });
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Error creating quiz", error: error.message });
  }
};

// Update a quiz
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, category, isPublished } = req.body;
    const quizId = req.params.quizId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Update quiz fields if provided
    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (category) quiz.category = category;
    if (isPublished !== undefined) quiz.isPublished = isPublished;

    quiz.updatedAt = Date.now();
    const updatedQuiz = await quiz.save();

    res.status(200).json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Error updating quiz", error: error.message });
  }
};

// Delete a quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;

    // First delete all associated questions
    await QuizQuestion.deleteMany({ quiz: quizId });

    // Then delete the quiz
    const result = await Quiz.findByIdAndDelete(quizId);

    if (!result) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.status(200).json({ message: "Quiz and all its questions deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ message: "Error deleting quiz", error: error.message });
  }
};

// Add a question to a quiz
exports.addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, questionType, options, correctAnswer, points, order } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const question = new QuizQuestion({
      quiz: quizId,
      questionText,
      questionType,
      options,
      correctAnswer,
      points: points || 1,
      order: order || quiz.questions.length
    });

    const savedQuestion = await question.save();

    // Add question to quiz
    quiz.questions.push(savedQuestion._id);
    await quiz.save();

    res.status(201).json({
      message: "Question added successfully",
      question: savedQuestion
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Error adding question", error: error.message });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { questionText, questionType, options, correctAnswer, points, order } = req.body;

    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update question fields if provided
    if (questionText) question.questionText = questionText;
    if (questionType) question.questionType = questionType;
    if (options) question.options = options;
    if (correctAnswer) question.correctAnswer = correctAnswer;
    if (points) question.points = points;
    if (order !== undefined) question.order = order;

    question.updatedAt = Date.now();
    const updatedQuestion = await question.save();

    res.status(200).json({
      message: "Question updated successfully",
      question: updatedQuestion
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Error updating question", error: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await QuizQuestion.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Remove question from quiz
    await Quiz.findByIdAndUpdate(
      question.quiz,
      { $pull: { questions: questionId } }
    );

    // Delete the question
    await QuizQuestion.findByIdAndDelete(questionId);

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Error deleting question", error: error.message });
  }
};

// Get all questions for a quiz
exports.getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;

    const questions = await QuizQuestion.find({ quiz: quizId }).sort({ order: 1 });

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error retrieving questions:", error);
    res.status(500).json({ message: "Error retrieving questions", error: error.message });
  }
};

// Publish a quiz
exports.publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    console.log("Attempting to publish quiz with ID:", quizId);

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      console.log("Quiz not found with ID:", quizId);
      return res.status(404).json({ message: "Quiz not found" });
    }

    console.log("Quiz found:", quiz.title, "Questions count:", quiz.questions.length);

    // Check if the quiz has at least one question
    if (quiz.questions.length === 0) {
      console.log("Cannot publish quiz without questions");
      return res.status(400).json({ message: "Cannot publish a quiz without questions" });
    }

    // Publish the quiz
    console.log("Publishing quiz:", quiz.title);
    quiz.isPublished = true;
    quiz.updatedAt = Date.now();

    const publishedQuiz = await quiz.save();
    console.log("Quiz published successfully:", publishedQuiz.title, "isPublished:", publishedQuiz.isPublished);

    res.status(200).json({
      message: "Quiz published successfully",
      quiz: publishedQuiz
    });
  } catch (error) {
    console.error("Error publishing quiz:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({ message: "Error publishing quiz", error: error.message });
  }
};
