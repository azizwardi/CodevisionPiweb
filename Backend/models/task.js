const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: [
      "pending",
      "in-progress",
      "completed",
      "in-review",
      "to-do",
      "backlog",
      "no-status",
    ],
    default: "pending",
  },
  taskType: {
    type: String,
    enum: [
      "development",
      "DEVOPS",
      "testing",
      "JS",
      "JAVA",
      "feature",
      "maintenance",
      "other",
    ],
    default: "development",
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  estimatedHours: { type: Number, default: 8 }, // Estimation du temps nécessaire en heures
  actualHours: { type: Number, default: 0 }, // Temps réel passé sur la tâche
  // Le champ requiredSkills a été supprimé car les compétences requises sont maintenant définies sur les membres
  autoAssigned: { type: Boolean, default: false }, // Indique si la tâche a été assignée automatiquement
  complexity: { type: Number, min: 1, max: 10, default: 5 }, // Niveau de complexité de la tâche
  dependencies: [{ type: Schema.Types.ObjectId, ref: "Task" }], // Tâches dont celle-ci dépend
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
