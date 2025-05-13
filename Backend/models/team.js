const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  teamLeader: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  members: [{
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    },
    skills: [{
      skill: {
        type: String,
        required: true
      },
      level: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
      }
    }],
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
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
teamSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("Team", teamSchema);
