const express = require("express");
const {
  createComment,
  getProjectComments,
  updateComment,
  deleteComment
} = require("../controllers/commentController");

const router = express.Router();

// Créer un nouveau commentaire
router.post("/", createComment);

// Récupérer tous les commentaires d'un projet
router.get("/project/:projectId", getProjectComments);

// Mettre à jour un commentaire
router.put("/:commentId", updateComment);

// Supprimer un commentaire
router.delete("/:commentId", deleteComment);

module.exports = router;
