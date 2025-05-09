const express = require("express");
const {
  updateProject,
  createProject,
  getAllProjects,
  getProjectById,
  deleteProject,
  getAllUsers,
  addMemberToProject,
  removeMemberFromProject,
  getProjectMembers,
  getProjectsByCreator
} = require("../controllers/projectController");

const router = express.Router();

// Récupérer tous les utilisateurs pour l'assignation
router.get("/users/all", getAllUsers);

// Récupérer tous les projets
router.get("/", getAllProjects);

// Récupérer les projets par créateur
router.get("/creator/:creatorId", getProjectsByCreator);

// Créer un nouveau projet
router.post("/", createProject);

// Récupérer un projet par son ID
router.get("/:projectId", getProjectById);

// Mettre à jour un projet
router.put("/:projectId", updateProject);

// Supprimer un projet
router.delete("/:projectId", deleteProject);

// Récupérer les membres d'un projet
router.get("/:projectId/members", getProjectMembers);

// Ajouter un membre à un projet
router.post("/:projectId/members", addMemberToProject);

// Supprimer un membre d'un projet
router.delete("/:projectId/members/:userId", removeMemberFromProject);

module.exports = router;
