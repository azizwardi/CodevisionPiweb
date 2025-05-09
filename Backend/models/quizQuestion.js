const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizQuestionSchema = new Schema({
  quiz: { 
    type: Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  questionType: { 
    type: String, 
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    default: 'multiple-choice'
  },
  options: [{ 
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: { 
    type: String,
    // Required for short-answer questions
  },
  points: { 
    type: Number, 
    default: 1 
  },
  order: { 
    type: Number,
    default: 0
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware pour mettre à jour la date de modification
quizQuestionSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("QuizQuestion", quizQuestionSchema);
