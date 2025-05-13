const express = require("express");
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByCreator,
  getTasksForMemberProjects,
  createTestTask
} = require("../controllers/taskController");

const router = express.Router();

// Get all tasks
router.get("/", getAllTasks);

// Routes spécifiques avec des préfixes (doivent être définies avant les routes paramétrées génériques)
// Get tasks by project
router.get("/project/:projectId", getTasksByProject);

// Get tasks created by a specific user (team leader)
router.get("/creator/:creatorId", getTasksByCreator);

// Get tasks for projects where a user is a member
router.get("/member-projects/:userId", getTasksForMemberProjects);

// Créer une tâche de test (temporaire, à des fins de débogage)
router.post("/test-task/:projectId/:userId", createTestTask);

// Routes CRUD génériques
// Create a new task
router.post("/", createTask);

// Get task by ID (cette route doit être après les routes spécifiques pour éviter les conflits)
router.get("/:taskId", getTaskById);

// Update a task
router.put("/:taskId", updateTask);

// Delete a task
router.delete("/:taskId", deleteTask);

module.exports = router;
