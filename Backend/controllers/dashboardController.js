const User = require("../models/user");
const Project = require("../models/project");
const Task = require("../models/task");
const Quiz = require("../models/quiz");
const QuizAttempt = require("../models/quizAttempt");
const Certificate = require("../models/certificate");

// Get statistics for the admin dashboard
exports.getAdminDashboardStats = async (req, res) => {
  try {
    // Get user statistics
    const users = await User.find();
    const userStats = {
      total: users.length,
      admins: users.filter(user => user.role === 'admin').length,
      teamLeaders: users.filter(user => user.role === 'TeamLeader').length,
      members: users.filter(user => user.role === 'Member').length,
    };

    // Get project statistics
    const projects = await Project.find();
    const currentDate = new Date();
    const projectStats = {
      total: projects.length,
      active: projects.filter(project => new Date(project.deadline) > currentDate).length,
      completed: projects.filter(project => new Date(project.deadline) <= currentDate).length,
    };

    // Get task statistics
    const tasks = await Task.find();
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      inProgress: tasks.filter(task => task.status === 'in-progress').length,
      completed: tasks.filter(task => task.status === 'completed').length,
    };

    // Get quiz statistics
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

    // Return all statistics
    res.status(200).json({
      users: userStats,
      projects: projectStats,
      tasks: taskStats,
      quizzes: quizStats,
    });
  } catch (error) {
    console.error("Error retrieving dashboard statistics:", error);
    res.status(500).json({
      message: "Error retrieving dashboard statistics",
      error: error.message
    });
  }
};

// Get statistics for the TeamLeader dashboard
exports.getTeamLeaderDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists and is a TeamLeader
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== 'TeamLeader') {
      return res.status(403).json({ message: "Access not authorized" });
    }

    // Get projects created by the TeamLeader
    const projects = await Project.find({ creator: userId });
    const projectIds = projects.map(project => project._id);

    // Get tasks associated with the TeamLeader's projects
    const tasks = await Task.find({ projectId: { $in: projectIds } });

    // Calculate statistics
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

    // Return statistics
    res.status(200).json({
      projects: projectStats,
      tasks: taskStats,
    });
  } catch (error) {
    console.error("Error retrieving TeamLeader dashboard statistics:", error);
    res.status(500).json({
      message: "Error retrieving TeamLeader dashboard statistics",
      error: error.message
    });
  }
};

// Get statistics for the Member dashboard
exports.getMemberDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if the user exists and is a Member
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role !== 'Member') {
      return res.status(403).json({ message: "Access not authorized" });
    }

    // Get tasks assigned to the Member
    const tasks = await Task.find({ assignedTo: userId });

    // Get projects the Member participates in
    const projects = await Project.find({ 'members.user': userId });

    // Get quiz attempts by the Member
    const quizAttempts = await QuizAttempt.find({ user: userId });
    const certificates = await Certificate.find({ user: userId });

    // Calculate statistics
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

    // Return statistics
    res.status(200).json({
      projects: { total: projects.length },
      tasks: taskStats,
      quizzes: quizStats,
    });
  } catch (error) {
    console.error("Error retrieving Member dashboard statistics:", error);
    res.status(500).json({
      message: "Error retrieving Member dashboard statistics",
      error: error.message
    });
  }
};
