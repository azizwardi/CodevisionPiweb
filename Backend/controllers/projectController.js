const Project = require("../models/project");
const { v4: uuidv4 } = require("uuid");

// Récupérer tous les projets
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des projets", error });
  }
};

// Récupérer un projet par son ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }
    res.status(200).json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du projet", error });
  }
};

// Créer un projet
exports.createProject = async (req, res) => {
  try {
    console.log("Requête de création de projet reçue:", req.body);
    const { name, description, category, startDate, deadline } = req.body;

    if (!name || !description || !category || !startDate || !deadline) {
      console.log("Validation échouée - champs manquants:", {
        name,
        description,
        category,
        startDate,
        deadline,
      });
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    console.log("Création d'un nouveau projet avec les données:", {
      name,
      description,
      category,
      startDate,
      deadline,
    });
    const project = new Project({
      name,
      description,
      category,
      startDate,
      deadline,
      projectId: uuidv4(),
    });

    console.log("Sauvegarde du projet dans la base de données...");
    await project.save();
    console.log("Projet sauvegardé avec succès, ID:", project._id);
    res.status(201).json({ message: "Projet créé avec succès", project });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Modifier un projet
exports.updateProject = async (req, res) => {
  try {
    console.log("Requête de modification de projet reçue:", req.body);
    console.log("ID du projet à modifier:", req.params.projectId);

    const { name, description, category, startDate, deadline } = req.body;

    // Vérification des champs requis
    if (!name || !description || !category || !startDate || !deadline) {
      console.log("Validation échouée - champs manquants:", { name, description, category, startDate, deadline });
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    // Recherche du projet
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      console.log("Projet non trouvé avec l'ID:", req.params.projectId);
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    console.log("Projet trouvé:", project);

    // Mise à jour des champs
    project.name = name;
    project.description = description;
    project.category = category;
    project.startDate = startDate;
    project.deadline = deadline;

    console.log("Sauvegarde des modifications...");
    await project.save();
    console.log("Projet mis à jour avec succès");

    // Essayer d'émettre un événement WebSocket si disponible
    try {
      if (global.io) {
        global.io.emit("projectUpdated", project);
        console.log("Événement WebSocket émis");
      }
    } catch (wsError) {
      console.log("Erreur lors de l'émission de l'événement WebSocket (non critique):", wsError.message);
    }

    res.status(200).json({ message: "Projet mis à jour avec succès", project });
  } catch (error) {
    console.error("Erreur lors de la modification du projet:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer un projet
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    await Project.findByIdAndDelete(req.params.projectId);
    res.status(200).json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression du projet", error });
  }
};
