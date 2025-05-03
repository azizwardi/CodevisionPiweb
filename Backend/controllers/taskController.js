const Task = require("../models/task");

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo").populate("projectId");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving tasks", error });
  }
};

// Get tasks by project
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ projectId }).populate("assignedTo").populate("projectId");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving tasks", error });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("assignedTo").populate("projectId");
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
    if (req.user && (req.user.role === 'admin' || req.user.role === 'Member')) {
      return res.status(403).json({
        message: "Les administrateurs et les membres ne sont pas autorisés à créer des tâches",
        isAdmin: req.user.role === 'admin',
        isMember: req.user.role === 'Member'
      });
    }

    console.log("Received task creation request:", req.body);
    const { title, description, status, assignedTo, projectId, dueDate } = req.body;

    console.log("Extracted data:", { title, description, status, assignedTo, projectId, dueDate });
    console.log("Types:", {
      assignedTo: typeof assignedTo,
      projectId: typeof projectId,
      dueDate: typeof dueDate
    });

    if (!title || !assignedTo || !projectId) {
      console.log("Validation failed - missing required fields");
      return res.status(400).json({ message: "Title, assignedTo and projectId are required" });
    }

    console.log("Creating new task with data:", {
      title,
      description,
      status,
      assignedTo,
      projectId,
      dueDate
    });

    const task = new Task({
      title,
      description,
      status,
      assignedTo,
      projectId,
      dueDate,
    });

    console.log("Task object created:", task);

    const savedTask = await task.save();
    console.log("Task saved successfully:", savedTask);

    res.status(201).json({ message: "Task created successfully", task: savedTask });
  } catch (error) {
    console.error("Error creating task:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Error creating task", error: error.message, stack: error.stack });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à modifier des tâches",
        isAdmin: true
      });
    }

    const { title, description, status, assignedTo, projectId, dueDate } = req.body;

    if (!title || !assignedTo || !projectId) {
      return res.status(400).json({ message: "Title, assignedTo and projectId are required" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.title = title;
    task.description = description;
    task.status = status;
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
    if (req.user && req.user.role === 'admin') {
      return res.status(403).json({
        message: "Les administrateurs ne sont pas autorisés à supprimer des tâches",
        isAdmin: true
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
