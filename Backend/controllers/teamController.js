const Team = require("../models/team");
const User = require("../models/user");

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("teamLeader", "username firstName lastName email avatarUrl")
      .populate("members.user", "username firstName lastName email avatarUrl role");

    res.status(200).json(teams);
  } catch (error) {
    console.error("Error retrieving teams:", error);
    res.status(500).json({ message: "Error retrieving teams", error: error.message });
  }
};

// Get teams by team leader
exports.getTeamsByLeader = async (req, res) => {
  try {
    const { leaderId } = req.params;

    const teams = await Team.find({ teamLeader: leaderId })
      .populate("teamLeader", "username firstName lastName email avatarUrl")
      .populate("members.user", "username firstName lastName email avatarUrl role");

    res.status(200).json(teams);
  } catch (error) {
    console.error("Error retrieving teams by leader:", error);
    res.status(500).json({ message: "Error retrieving teams by leader", error: error.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate("teamLeader", "username firstName lastName email avatarUrl")
      .populate("members.user", "username firstName lastName email avatarUrl role");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error("Error retrieving team:", error);
    res.status(500).json({ message: "Error retrieving team", error: error.message });
  }
};

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { name, description, teamLeader } = req.body;

    console.log("Creating team with data:", { name, description, teamLeader });

    // Validate required fields
    if (!name || !teamLeader) {
      console.log("Validation failed: Name or teamLeader is missing");
      return res.status(400).json({ message: "Name and teamLeader are required" });
    }

    // Check if the team leader exists and has the TeamLeader role
    const leaderUser = await User.findById(teamLeader);
    if (!leaderUser) {
      console.log("Team leader not found with ID:", teamLeader);
      return res.status(404).json({ message: "Team leader not found" });
    }

    if (leaderUser.role !== "TeamLeader") {
      console.log("User is not a TeamLeader. Role:", leaderUser.role);
      return res.status(400).json({ message: "Only users with TeamLeader role can be team leaders" });
    }

    // Create the team
    const team = new Team({
      name,
      description: description || "", // Ensure description is never undefined
      teamLeader,
      members: []
    });

    console.log("Team object before saving:", team);

    const savedTeam = await team.save();

    console.log("Team saved successfully:", savedTeam);

    res.status(201).json({
      message: "Team created successfully",
      team: savedTeam
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;

    console.log("Updating team with data:", { teamId, name, description });

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      console.log("Team not found with ID:", teamId);
      return res.status(404).json({ message: "Team not found" });
    }

    // Update team fields
    if (name) team.name = name;
    // Ensure description is never undefined
    if (description !== undefined) team.description = description || "";

    console.log("Team object before saving:", team);

    const updatedTeam = await team.save();

    console.log("Team updated successfully:", updatedTeam);

    res.status(200).json({
      message: "Team updated successfully",
      team: updatedTeam
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ message: "Error updating team", error: error.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Find and delete the team
    const deletedTeam = await Team.findByIdAndDelete(teamId);

    if (!deletedTeam) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.status(200).json({
      message: "Team deleted successfully",
      team: deletedTeam
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
};

// Add a member to a team
exports.addMemberToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, skills } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Member email is required" });
    }

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with the provided email" });
    }

    // Check if the user has the Member role
    if (user.role !== "Member") {
      return res.status(400).json({ message: "Only users with Member role can be added to teams" });
    }

    // Check if the user is already a member of the team
    const isMember = team.members.some(member => member.user.toString() === user._id.toString());
    if (isMember) {
      return res.status(400).json({ message: "User is already a member of this team" });
    }

    // Add the member to the team
    team.members.push({
      user: user._id,
      skills: skills || []
    });

    const updatedTeam = await team.save();

    // Populate the user data for the response
    const populatedTeam = await Team.findById(updatedTeam._id)
      .populate("teamLeader", "username firstName lastName email avatarUrl")
      .populate("members.user", "username firstName lastName email avatarUrl role");

    res.status(200).json({
      message: "Member added to team successfully",
      team: populatedTeam
    });
  } catch (error) {
    console.error("Error adding member to team:", error);
    res.status(500).json({ message: "Error adding member to team", error: error.message });
  }
};

// Remove a member from a team
exports.removeMemberFromTeam = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if the member exists in the team
    const memberIndex = team.members.findIndex(member => member.user.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in this team" });
    }

    // Remove the member from the team
    team.members.splice(memberIndex, 1);

    const updatedTeam = await team.save();

    res.status(200).json({
      message: "Member removed from team successfully",
      team: updatedTeam
    });
  } catch (error) {
    console.error("Error removing member from team:", error);
    res.status(500).json({ message: "Error removing member from team", error: error.message });
  }
};

// Update member skills
exports.updateMemberSkills = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const { skills } = req.body;

    // Find the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Find the member in the team
    const memberIndex = team.members.findIndex(member => member.user.toString() === memberId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in this team" });
    }

    // Update the member's skills
    team.members[memberIndex].skills = skills;

    const updatedTeam = await team.save();

    res.status(200).json({
      message: "Member skills updated successfully",
      team: updatedTeam
    });
  } catch (error) {
    console.error("Error updating member skills:", error);
    res.status(500).json({ message: "Error updating member skills", error: error.message });
  }
};
