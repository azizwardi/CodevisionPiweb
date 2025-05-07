const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
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
  isPerfectScore: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  // Champ pour stocker l'URL ou le chemin vers le certificat généré
  certificateUrl: {
    type: String
  }
});

// Méthode pour générer un ID de certificat unique
certificateSchema.statics.generateCertificateId = function() {
  const prefix = 'CERT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
