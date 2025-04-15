const express = require("express");
const {
  updateProject,
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

// Get all projects
router.get("/", getAllProjects);

// Get a project by its ID
router.get("/:projectId", getProjectById);

// Create a new project
router.post("/addProject", createProject);

// Update a project
router.put("/:projectId", updateProject);

// Delete a project
router.delete("/:projectId", deleteProject);

module.exports = router;
