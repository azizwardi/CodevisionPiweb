const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  projectId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
