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
      .populate("projectId");
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
      .populate("projectId");
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

    // Créer l'objet de tâche
    const task = new Task({
      title,
      description,
      status: status || "pending",
      taskType: taskType || "development",
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
      .populate("projectId");

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
