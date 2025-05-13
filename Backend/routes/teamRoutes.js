const express = require("express");
const {
  getAllTeams,
  getTeamsByLeader,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMemberToTeam,
  removeMemberFromTeam,
  updateMemberSkills
} = require("../controllers/teamController");

const router = express.Router();

// Get all teams
router.get("/", getAllTeams);

// Get teams by team leader
router.get("/leader/:leaderId", getTeamsByLeader);

// Get team by ID
router.get("/:teamId", getTeamById);

// Create a new team
router.post("/", createTeam);

// Update a team
router.put("/:teamId", updateTeam);

// Delete a team
router.delete("/:teamId", deleteTeam);

// Add a member to a team
router.post("/:teamId/members", addMemberToTeam);

// Remove a member from a team
router.delete("/:teamId/members/:memberId", removeMemberFromTeam);

// Update member skills
router.put("/:teamId/members/:memberId/skills", updateMemberSkills);

module.exports = router;
