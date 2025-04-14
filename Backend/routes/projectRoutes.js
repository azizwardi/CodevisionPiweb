const express = require("express");
const {
  updateProject,
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

// Récupérer tous les projets
router.get("/", getAllProjects);

// Récupérer un projet par son ID
router.get("/:projectId", getProjectById);

// Créer un nouveau projet
router.post("/", createProject);

// Mettre à jour un projet
router.put("/:projectId", updateProject);

// Supprimer un projet
router.delete("/:projectId", deleteProject);

module.exports = router;
