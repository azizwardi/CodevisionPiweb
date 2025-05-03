const Project = require("../models/project");
const User = require("../models/user");
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

// Récupérer les projets par créateur
exports.getProjectsByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const projects = await Project.find({ creator: creatorId });
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
    const { name, description, category, startDate, deadline, userId } = req.body;

    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à créer des projets",
        isAdmin: true
      });
    }

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

    // Vérifier si l'utilisateur existe
    if (userId) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
    }

    console.log("Création d'un nouveau projet avec les données:", {
      name,
      description,
      category,
      startDate,
      deadline,
      creator: userId
    });
    const project = new Project({
      name,
      description,
      category,
      startDate,
      deadline,
      projectId: uuidv4(),
      creator: userId
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

    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à modifier des projets",
        isAdmin: true
      });
    }

    const { name, description, category, startDate, deadline, userId } = req.body;

    // Vérification des champs requis
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

    // Recherche du projet
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      console.log("Projet non trouvé avec l'ID:", req.params.projectId);
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    console.log("Projet trouvé:", project);

    // Vérifier si l'utilisateur est le créateur du projet
    if (project.creator && userId && project.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à modifier ce projet",
        isCreator: false
      });
    }

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
      console.log(
        "Erreur lors de l'émission de l'événement WebSocket (non critique):",
        wsError.message
      );
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
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à supprimer des projets",
        isAdmin: true
      });
    }

    const { userId } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifier si l'utilisateur est le créateur du projet
    if (project.creator && userId && project.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Vous n'êtes pas autorisé à supprimer ce projet",
        isCreator: false
      });
    }

    await Project.findByIdAndDelete(req.params.projectId);
    res.status(200).json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression du projet", error });
  }
};

// Récupérer tous les utilisateurs pour l'assignation
exports.getAllUsers = async (req, res) => {
  try {
    const { email } = req.query;
    let query = { role: "Member" }; // Ne récupérer que les utilisateurs avec le rôle "Member"

    // Filtrer par email si fourni
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    const users = await User.find(query).select('_id username email firstName lastName role');
    res.status(200).json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message
    });
  }
};

// Ajouter un membre à un projet
exports.addMemberToProject = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à ajouter des membres aux projets",
        isAdmin: true
      });
    }

    const { projectId } = req.params;
    const { userId, role = 'member', email } = req.body;

    // Vérifier si le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a le rôle "Member"
    if (user.role !== "Member") {
      return res.status(403).json({
        message: "Ce mail n'est pas d'un member",
        role: user.role
      });
    }

    // Vérifier si l'utilisateur est déjà membre du projet
    const isMember = project.members.some(member => member.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: "L'utilisateur est déjà membre de ce projet" });
    }

    // Ajouter l'utilisateur aux membres du projet
    project.members.push({
      user: userId,
      role,
      addedAt: new Date()
    });

    await project.save();

    // Notification supprimée - Aucun email n'est envoyé

    // Essayer d'émettre des événements WebSocket en temps réel
    try {
      if (global.io) {
        console.log(`Envoi de notifications en temps réel pour l'ajout de l'utilisateur ${userId} au projet ${project.name}`);

        // Récupérer l'ID de l'utilisateur qui fait la requête (l'administrateur)
        const adminId = req.user ? req.user._id.toString() : 'unknown';
        console.log(`ID de l'administrateur qui fait l'ajout: ${adminId}`);
        console.log(`ID de l'utilisateur ajouté: ${userId}`);

        // IMPORTANT: Créer deux notifications distinctes avec des identifiants clairs

        // 1. Notification pour l'utilisateur qui a été ajouté au projet
        const memberNotificationData = {
          type: "member_notification",
          projectId,
          userId,
          projectName: project.name,
          userName: user.username || user.email,
          targetUserId: userId,         // ID de l'utilisateur qui doit recevoir cette notification
          forUserId: userId,            // Explicitement indiquer pour qui est cette notification
          message: `Vous avez été ajouté au projet "${project.name}"`,
          timestamp: new Date().toISOString(),
          realtime: true                // Indiquer que c'est une notification en temps réel
        };

        // 2. Notification pour l'utilisateur qui a effectué l'ajout
        const adminNotificationData = {
          type: "admin_notification",
          projectId,
          userId,
          projectName: project.name,
          userName: user.username || user.email,
          adminId: adminId,             // ID de l'administrateur
          forUserId: adminId,           // Explicitement indiquer pour qui est cette notification
          message: "affectation reussite",
          timestamp: new Date().toISOString(),
          realtime: true                // Indiquer que c'est une notification en temps réel
        };

        console.log("Envoi de notifications en temps réel:");

        // Stratégie 1: Broadcast global (le plus fiable pour les tests)
        global.io.emit("memberAdded", memberNotificationData);
        global.io.emit("memberAdded", adminNotificationData);
        console.log("Notifications envoyées en broadcast global (stratégie 1)");

        // Stratégie 2: Envoi ciblé aux rooms spécifiques
        if (userId) {
          const userRoom = `user_${userId}`;
          global.io.to(userRoom).emit("memberAdded", memberNotificationData);
          console.log(`Notification membre envoyée à la room ${userRoom} (stratégie 2)`);
        }

        if (adminId && adminId !== 'unknown') {
          const adminRoom = `user_${adminId}`;
          global.io.to(adminRoom).emit("memberAdded", adminNotificationData);
          console.log(`Notification admin envoyée à la room ${adminRoom} (stratégie 2)`);
        }

        // Stratégie 3: Envoi à toutes les sockets connectées
        const sockets = Array.from(global.io.sockets.sockets.values());
        console.log(`Nombre de sockets connectées: ${sockets.length}`);

        sockets.forEach(socket => {
          if (socket.userId === userId) {
            socket.emit("memberAdded", memberNotificationData);
            console.log(`Notification membre envoyée directement à la socket ${socket.id} (stratégie 3)`);
          }

          if (socket.userId === adminId) {
            socket.emit("memberAdded", adminNotificationData);
            console.log(`Notification admin envoyée directement à la socket ${socket.id} (stratégie 3)`);
          }
        });

      } else {
        console.log("Impossible d'émettre les notifications: global.io n'est pas défini");
      }
    } catch (wsError) {
      console.log(
        "Erreur lors de l'émission des événements WebSocket (non critique):",
        wsError.message
      );
    }

    res.status(200).json({
      message: "Membre ajouté avec succès",
      member: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        role,
        addedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'un membre:", error);
    res.status(500).json({
      message: "Erreur lors de l'ajout d'un membre",
      error: error.message
    });
  }
};

// Supprimer un membre d'un projet
exports.removeMemberFromProject = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à supprimer des membres des projets",
        isAdmin: true
      });
    }

    const { projectId, userId } = req.params;

    // Vérifier si le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifier si l'utilisateur est membre du projet
    const memberIndex = project.members.findIndex(member => member.user.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "L'utilisateur n'est pas membre de ce projet" });
    }

    // Supprimer l'utilisateur des membres du projet
    project.members.splice(memberIndex, 1);
    await project.save();

    res.status(200).json({ message: "Membre supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression d'un membre:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression d'un membre",
      error: error.message
    });
  }
};

// Récupérer les membres d'un projet
exports.getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Récupérer le projet avec les membres populés
    const project = await Project.findById(projectId).populate('members.user', '_id username email firstName lastName');
    if (!project) {
      return res.status(404).json({ message: "Projet non trouvé" });
    }

    res.status(200).json(project.members);
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des membres",
      error: error.message
    });
  }
};
