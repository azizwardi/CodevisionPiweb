const express = require("express");
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
} = require("../controllers/taskController");

const router = express.Router();

// Get all tasks
router.get("/", getAllTasks);

// Get tasks by project
router.get("/project/:projectId", getTasksByProject);

// Get task by ID
router.get("/:taskId", getTaskById);

// Create a new task
router.post("/", createTask);

// Update a task
router.put("/:taskId", updateTask);

// Delete a task
router.delete("/:taskId", deleteTask);

// Get tasks by project ID
router.get("/project/:projectId", getTasksByProject);

module.exports = router;
