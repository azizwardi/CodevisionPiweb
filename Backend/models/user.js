const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: {
    type: String,
    sparse: true,
  },
  displayName: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "TeamLeader", "Member", "", "user"],
    default: "",
  },
  phoneNumber: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  avatarUrl: {
    type: String,
  },
  facebook: {
    type: String,
  },
  twitter: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  instagram: {
    type: String,
  },
  skills: [
    {
      skill: {
        type: Schema.Types.ObjectId,
        ref: "Skill",
      },
      proficiencyLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      yearsOfExperience: {
        type: Number,
        default: 0,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  requiredSkills: [
    {
      skill: {
        type: Schema.Types.ObjectId,
        ref: "Skill",
      },
      minimumLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 1,
      },
    },
  ],
  availability: {
    type: Number, // Pourcentage de disponibilité (0-100)
    default: 100,
  },
  workload: {
    type: Number, // Nombre d'heures de travail actuellement assignées
    default: 0,
  },
  performanceRating: {
    type: Number, // Note de performance (1-5)
    min: 1,
    max: 5,
    default: 3,
  },
  experienceLevel: {
    type: String,
    enum: ["intern", "junior", "mid-level", "senior", "expert", "lead"],
    default: "mid-level",
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
