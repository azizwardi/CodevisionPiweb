const Event = require("../models/Event");

// Récupérer tous les événements
exports.getAllEvents = async (req, res) => {
  try {
    console.log("Récupération de tous les événements");
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des événements", error: error.message });
  }
};

// Récupérer un événement par son ID
exports.getEventById = async (req, res) => {
  try {
    console.log("Récupération de l'événement avec l'ID:", req.params.eventId);
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'événement", error: error.message });
  }
};

// Créer un événement
exports.createEvent = async (req, res) => {
  try {
    console.log("Requête de création d'événement reçue:", req.body);

    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à créer des événements",
        isAdmin: true
      });
    }

    const { title, start, end, allDay, calendar } = req.body;

    if (!title || !start) {
      console.log("Validation échouée - champs manquants:", {
        title,
        start,
      });
      return res.status(400).json({ message: "Le titre et la date de début sont requis" });
    }

    console.log("Création d'un nouvel événement avec les données:", {
      title,
      start,
      end,
      allDay,
      calendar,
    });

    const event = new Event({
      title,
      start,
      end,
      allDay,
      calendar,
      createdBy: req.user ? req.user._id : null,
    });

    console.log("Sauvegarde de l'événement dans la base de données...");
    await event.save();
    console.log("Événement sauvegardé avec succès, ID:", event._id);
    res.status(201).json({ message: "Événement créé avec succès", event });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Modifier un événement
exports.updateEvent = async (req, res) => {
  try {
    console.log("Requête de modification d'événement reçue:", req.body);
    console.log("ID de l'événement à modifier:", req.params.eventId);

    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à modifier des événements",
        isAdmin: true
      });
    }

    const { title, start, end, allDay, calendar } = req.body;

    // Vérification des champs requis
    if (!title || !start) {
      console.log("Validation échouée - champs manquants:", {
        title,
        start,
      });
      return res.status(400).json({ message: "Le titre et la date de début sont requis" });
    }

    // Recherche de l'événement
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      console.log("Événement non trouvé avec l'ID:", req.params.eventId);
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    console.log("Événement trouvé:", event);

    // Mise à jour des champs
    event.title = title;
    event.start = start;
    event.end = end;
    event.allDay = allDay !== undefined ? allDay : event.allDay;
    event.calendar = calendar || event.calendar;

    console.log("Sauvegarde des modifications...");
    await event.save();
    console.log("Événement mis à jour avec succès");

    res.status(200).json({ message: "Événement mis à jour avec succès", event });
  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer un événement
exports.deleteEvent = async (req, res) => {
  try {
    console.log("Suppression de l'événement avec l'ID:", req.params.eventId);

    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à supprimer des événements",
        isAdmin: true
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé" });
    }

    await Event.findByIdAndDelete(req.params.eventId);
    console.log("Événement supprimé avec succès");
    res.status(200).json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
