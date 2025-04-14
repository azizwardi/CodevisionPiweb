const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  projectId: { type: String, unique: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  members: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    addedAt: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now }
});

// Update lastUpdated timestamp before saving
projectSchema.pre("save", function(next) {
  this.lastUpdated = new Date();
  next();
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
