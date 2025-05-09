const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const quizSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  creator: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  questions: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'QuizQuestion' 
  }],
  isPublished: { 
    type: Boolean, 
    default: false 
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
quizSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("Quiz", quizSchema);
