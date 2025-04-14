const express = require("express");
const {
  updateEvent,
  createEvent,
  getAllEvents,
  getEventById,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

// Récupérer tous les événements
router.get("/", getAllEvents);

// Récupérer un événement par son ID
router.get("/:eventId", getEventById);

// Créer un nouvel événement
router.post("/", createEvent);

// Mettre à jour un événement
router.put("/:eventId", updateEvent);

// Supprimer un événement
router.delete("/:eventId", deleteEvent);

module.exports = router;
