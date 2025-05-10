const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseRecommendationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  quizAttempt: {
    type: Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  recommendedCourses: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'],
      default: 'Intermédiaire'
    },
    relevanceScore: {
      type: Number,
      default: 1
    },
    imageUrl: {
      type: String
    }
  }],
  score: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  reason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CourseRecommendation", courseRecommendationSchema);
