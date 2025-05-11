const User = require("../models/user");
const Project = require("../models/project");
const Task = require("../models/task");
const Quiz = require("../models/quiz");
const QuizAttempt = require("../models/quizAttempt");
const Certificate = require("../models/certificate");

// Récupérer les statistiques pour le dashboard administrateur
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Récupérer les statistiques des utilisateurs
    const users = await User.find();
    const userStats = {
      total: users.length,
      admins: users.filter(user => user.role === 'admin').length,
      teamLeaders: users.filter(user => user.role === 'TeamLeader').length,
      members: users.filter(user => user.role === 'Member').length,
    };

    // Récupérer les statistiques des projets
    const projects = await Project.find();
    const currentDate = new Date();
    const projectStats = {
      total: projects.length,
      active: projects.filter(project => new Date(project.deadline) > currentDate).length,
      completed: projects.filter(project => new Date(project.deadline) <= currentDate).length,
    };

    // Récupérer les statistiques des tâches
    const tasks = await Task.find();
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
    };

    // Récupérer les statistiques des quiz
    const quizzes = await Quiz.find();
    const quizAttempts = await QuizAttempt.find();
    const certificates = await Certificate.find();
    const quizStats = {
      total: quizzes.length,
      published: quizzes.filter(quiz => quiz.isPublished).length,
      attempts: quizAttempts.length,
      completedAttempts: quizAttempts.filter(attempt => attempt.completed).length,
      certificates: certificates.length,
    };

    // Renvoyer toutes les statistiques
    res.status(200).json({
      users: userStats,
      projects: projectStats,
      tasks: taskStats,
      quizzes: quizStats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du dashboard:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques du dashboard", 
      error: error.message 
    });
  }
};

// Récupérer les statistiques pour le dashboard TeamLeader
exports.getTeamLeaderDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    // Vérifier si l'utilisateur existe et est un TeamLeader
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    if (user.role !== 'TeamLeader') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    // Récupérer les projets créés par le TeamLeader
    const projects = await Project.find({ creator: userId });
    const projectIds = projects.map(project => project._id);

    // Récupérer les tâches associées aux projets du TeamLeader
    const tasks = await Task.find({ projectId: { $in: projectIds } });

    // Calculer les statistiques
    const currentDate = new Date();
    const projectStats = {
      total: projects.length,
      active: projects.filter(project => new Date(project.deadline) > currentDate).length,
      completed: projects.filter(project => new Date(project.deadline) <= currentDate).length,
    };

    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
    };

    // Renvoyer les statistiques
    res.status(200).json({
      projects: projectStats,
      tasks: taskStats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du dashboard TeamLeader:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques du dashboard TeamLeader", 
      error: error.message 
    });
  }
};

// Récupérer les statistiques pour le dashboard Member
exports.getMemberDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    // Vérifier si l'utilisateur existe et est un Member
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    if (user.role !== 'Member') {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    // Récupérer les tâches assignées au Member
    const tasks = await Task.find({ assignedTo: userId });

    // Récupérer les projets auxquels le Member participe
    const projects = await Project.find({ 'members.user': userId });

    // Récupérer les tentatives de quiz du Member
    const quizAttempts = await QuizAttempt.find({ user: userId });
    const certificates = await Certificate.find({ user: userId });

    // Calculer les statistiques
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
    };

    const quizStats = {
      attempts: quizAttempts.length,
      completed: quizAttempts.filter(attempt => attempt.completed).length,
      certificates: certificates.length,
    };

    // Renvoyer les statistiques
    res.status(200).json({
      projects: { total: projects.length },
      tasks: taskStats,
      quizzes: quizStats,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du dashboard Member:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des statistiques du dashboard Member", 
      error: error.message 
    });
  }
};
