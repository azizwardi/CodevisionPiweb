const express = require("express");
const {
  getAdminDashboardStats,
  getTeamLeaderDashboardStats,
  getMemberDashboardStats
} = require("../controllers/dashboardController");

const router = express.Router();

// Routes pour les statistiques du dashboard
router.get("/admin", getAdminDashboardStats);
router.get("/team-leader/:userId", getTeamLeaderDashboardStats);
router.get("/member/:userId", getMemberDashboardStats);

module.exports = router;
