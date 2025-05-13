const Task = require("../models/task");
const User = require("../models/user");
const Skill = require("../models/skill");
const Project = require("../models/project");
const TaskAssignmentService = require("../services/taskAssignmentService");

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving tasks", error });
  }
};

// Get tasks by project (deprecated - use the more detailed version below)
// This function is kept for backward compatibility
exports.getTasksByProjectSimple = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId })
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving tasks", error });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving task", error });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin ou un membre
    if (req.user && (req.user.role === "admin" || req.user.role === "Member")) {
      return res.status(403).json({
        message:
          "Les administrateurs et les membres ne sont pas autorisés à créer des tâches",
        isAdmin: req.user.role === "admin",
        isMember: req.user.role === "Member",
      });
    }

    console.log("Received task creation request:", req.body);
    const {
      title,
      description,
      status,
      taskType,
      assignedTo,
      projectId,
      dueDate,
      priority,
      estimatedHours,
      complexity,
      dependencies,
      autoAssign, // Paramètre pour l'assignation automatique
    } = req.body;

    console.log("Extracted data:", {
      title,
      description,
      status,
      taskType,
      assignedTo,
      projectId,
      dueDate,
      autoAssign,
    });

    // Validation de base
    if (!title || !projectId) {
      console.log("Validation failed - missing required fields");
      return res
        .status(400)
        .json({ message: "Title and projectId are required" });
    }

    // Si autoAssign est false, assignedTo est requis
    if (!autoAssign && !assignedTo) {
      return res
        .status(400)
        .json({ message: "assignedTo is required when autoAssign is false" });
    }

    // Récupérer l'ID de l'utilisateur qui crée la tâche (team leader)
    const creatorId = req.body.userId || (req.user && req.user.id);

    if (!creatorId) {
      return res.status(400).json({ message: "Creator ID is required" });
    }

    // Créer l'objet de tâche
    const task = new Task({
      title,
      description,
      status: status || "pending",
      taskType: taskType || "development",
      createdBy: creatorId, // Ajouter le créateur
      projectId,
      dueDate,
      priority: priority || "medium",
      estimatedHours: estimatedHours || 8,
      complexity: complexity || 5,
      dependencies: dependencies || [],
      autoAssigned: !!autoAssign,
    });

    // Les compétences requises sont maintenant définies sur les membres, pas sur les tâches

    // Si l'assignation automatique est demandée
    if (autoAssign) {
      try {
        console.log("Auto-assigning task to best member...");

        // Vérifier si le projet existe
        const project = await Project.findById(projectId);
        if (!project) {
          console.error("Projet non trouvé:", projectId);
          return res.status(404).json({
            message: "Projet non trouvé",
            projectId: projectId,
          });
        }

        console.log("Projet trouvé:", project.name);

        // Vérifier si le projet a des membres
        if (!project.members || project.members.length === 0) {
          console.error("Le projet n'a pas de membres assignés:", projectId);
          return res.status(400).json({
            message:
              "Le projet n'a pas de membres assignés. Veuillez ajouter des membres au projet avant d'utiliser l'assignation automatique.",
            projectId: projectId,
          });
        }

        console.log("Membres du projet:", project.members.length);

        // Appeler le service d'assignation automatique
        const result = await TaskAssignmentService.autoAssignTask(
          task,
          projectId
        );

        console.log("Task auto-assigned successfully:", {
          taskId: result.task._id,
          assignedTo: result.member.username || result.member._id,
          score: result.score,
        });

        return res.status(201).json({
          message: "Task created and auto-assigned successfully",
          task: result.task,
          assignedMember: result.member,
          score: result.score,
        });
      } catch (assignError) {
        console.error("Error during auto-assignment:", assignError);
        return res.status(400).json({
          message:
            "Erreur lors de l'assignation automatique: " + assignError.message,
          error: assignError.message,
          stack: assignError.stack,
        });
      }
    } else {
      // Assignation manuelle
      task.assignedTo = assignedTo;

      console.log("Task object created:", task);
      const savedTask = await task.save();
      console.log("Task saved successfully:", savedTask);

      // Mettre à jour la charge de travail du membre assigné
      const assignedMember = await User.findById(assignedTo);
      if (assignedMember) {
        assignedMember.workload += task.estimatedHours || 8;
        await assignedMember.save();
      }

      return res.status(201).json({
        message: "Task created successfully",
        task: savedTask,
      });
    }
  } catch (error) {
    console.error("Error creating task:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error creating task",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === "admin") {
      return res.status(403).json({
        message:
          "Les administrateurs ne sont pas autorisés à modifier des tâches",
        isAdmin: true,
      });
    }

    const {
      title,
      description,
      status,
      taskType,
      assignedTo,
      projectId,
      dueDate,
    } = req.body;

    if (!title || !assignedTo || !projectId) {
      return res
        .status(400)
        .json({ message: "Title, assignedTo and projectId are required" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.title = title;
    task.description = description;
    task.status = status;
    task.taskType = taskType || task.taskType;
    task.assignedTo = assignedTo;
    task.projectId = projectId;
    task.dueDate = dueDate;

    await task.save();
    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === "admin") {
      return res.status(403).json({
        message:
          "Les administrateurs ne sont pas autorisés à supprimer des tâches",
        isAdmin: true,
      });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};

// Get tasks by project ID
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Vérifier si le projet existe
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Récupérer toutes les tâches associées au projet
    const tasks = await Task.find({ projectId })
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");

    console.log(`Found ${tasks.length} tasks for project ${projectId}`);

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks by project:", error);
    res.status(500).json({
      message: "Error retrieving tasks for this project",
      error: error.message,
    });
  }
};

// Get tasks created by a specific user (team leader)
exports.getTasksByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(creatorId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Récupérer toutes les tâches créées par cet utilisateur
    const tasks = await Task.find({ createdBy: creatorId })
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");

    console.log(`Found ${tasks.length} tasks created by user ${creatorId}`);

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks by creator:", error);
    res.status(500).json({
      message: "Error retrieving tasks for this creator",
      error: error.message,
    });
  }
};

// Créer une tâche de test (temporaire, à des fins de débogage)
exports.createTestTask = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Vérifier si le projet existe
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Créer une tâche de test
    const testTask = new Task({
      title: "Tâche de test",
      description: "Ceci est une tâche de test créée automatiquement",
      status: "pending",
      taskType: "development",
      createdBy: userId, // L'utilisateur est aussi le créateur pour ce test
      assignedTo: userId,
      projectId: projectId,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
      priority: "medium",
      estimatedHours: 8,
      complexity: 3
    });

    await testTask.save();

    res.status(201).json({
      message: "Tâche de test créée avec succès",
      task: testTask
    });
  } catch (error) {
    console.error("Error creating test task:", error);
    res.status(500).json({
      message: "Error creating test task",
      error: error.message
    });
  }
};

// Get tasks assigned to a specific user in a specific project
exports.getTasksAssignedToUserInProject = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Vérifier si le projet existe
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Recherche des tâches avec projectId=${projectId} et assignedTo=${userId}`);

    // Vérifier si des tâches existent pour ce projet
    const allProjectTasks = await Task.find({ projectId: projectId });
    console.log(`Nombre total de tâches dans ce projet: ${allProjectTasks.length}`);

    // Vérifier si des tâches sont assignées à cet utilisateur
    const allUserTasks = await Task.find({ assignedTo: userId });
    console.log(`Nombre total de tâches assignées à cet utilisateur: ${allUserTasks.length}`);

    // Afficher toutes les tâches pour comprendre leur structure
    const sampleTasks = await Task.find().limit(2);
    if (sampleTasks.length > 0) {
      console.log("Exemple de tâche:", JSON.stringify(sampleTasks[0], null, 2));
    }

    // Récupérer toutes les tâches assignées à cet utilisateur dans ce projet
    // Utiliser toString() pour s'assurer que la comparaison est correcte
    const tasks = await Task.find()
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");

    // Filtrer manuellement pour s'assurer que les IDs correspondent
    const filteredTasks = tasks.filter(task => {
      const taskProjectId = task.projectId && task.projectId._id ? task.projectId._id.toString() : null;
      const taskAssignedTo = task.assignedTo && task.assignedTo._id ? task.assignedTo._id.toString() : null;

      const projectMatches = taskProjectId === projectId;
      const userMatches = taskAssignedTo === userId;

      console.log(`Tâche ${task._id}: projectId=${taskProjectId} (match=${projectMatches}), assignedTo=${taskAssignedTo} (match=${userMatches})`);

      return projectMatches && userMatches;
    });

    console.log(`Tâches trouvées après filtrage manuel: ${filteredTasks.length}`);

    console.log(`Found ${filteredTasks.length} tasks assigned to user ${userId} in project ${projectId}`);

    res.status(200).json(filteredTasks);
  } catch (error) {
    console.error("Error retrieving tasks assigned to user in project:", error);
    res.status(500).json({
      message: "Error retrieving tasks assigned to user in project",
      error: error.message,
    });
  }
};

// Get tasks for projects where a user is a member
exports.getTasksForMemberProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Trouver tous les projets où l'utilisateur est membre
    console.log(`Recherche des projets pour l'utilisateur ${userId}...`);
    const projects = await Project.find({
      "members.user": userId
    });

    console.log(`Found ${projects.length} projects where user ${userId} is a member`);

    if (projects.length === 0) {
      return res.status(200).json([]);
    }

    // Récupérer les IDs des projets
    const projectIds = projects.map(project => project._id);

    // Récupérer toutes les tâches associées à ces projets
    const tasks = await Task.find({
      projectId: { $in: projectIds }
    })
      .populate("assignedTo")
      .populate("projectId")
      .populate("createdBy");

    console.log(`Found ${tasks.length} tasks for projects where user ${userId} is a member`);

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error retrieving tasks for member projects:", error);
    res.status(500).json({
      message: "Error retrieving tasks for member projects",
      error: error.message,
    });
  }
};
