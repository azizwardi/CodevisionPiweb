const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizAttemptSchema = new Schema({
  quiz: { 
    type: Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  answers: [{
    question: {
      type: Schema.Types.ObjectId,
      ref: 'QuizQuestion',
      required: true
    },
    selectedOption: {
      type: String,
      // Pour les questions à choix multiple, c'est l'index de l'option sélectionnée
    },
    textAnswer: {
      type: String,
      // Pour les questions à réponse courte
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date
  }
});

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
