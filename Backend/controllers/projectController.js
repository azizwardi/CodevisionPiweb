const Project = require("../models/project");
const Notification = require("../models/notifications")

async function createProject(req, res) {
  try {
    const {
      projectName,
      projectDesc,
      projectCategory,
      projectStartDate,
      projectEndDate
    } = req.body;

    const userId = req.user.id;

    const newProject = new Project({
      projectName,
      projectDesc,
      projectCategory,
      projectStartDate,
      projectEndDate,
      project_admins_ids: [userId]
    });

    await newProject.save();

    return res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}



async function addUserToProject(req, res) {
  try {
    const { project_id, user_id } = req.params;
    const { role } = req.body;
    const requesterId = req.user.id;

    // Validate role
    const validRoles = ["admin", "owner", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if requester is admin or owner
    const isAuthorized =
      project.project_admins_ids.includes(requesterId) ||
      project.project_owners_ids.includes(requesterId);

    if (!isAuthorized) {
      return res.status(403).json({ message: "Only admins or owners can add users to this project" });
    }

    // Check if user already exists in any role
    const alreadyExists =
      project.project_admins_ids.includes(user_id) ||
      project.project_owners_ids.includes(user_id) ||
      project.project_users_ids.includes(user_id);

    if (alreadyExists) {
      return res.status(400).json({ message: "User already exists in this project" });
    }

    // Add user to the appropriate array
    if (role === "admin") {
      project.project_admins_ids.push(user_id);
    } else if (role === "owner") {
      project.project_owners_ids.push(user_id);
    } else if (role === "user") {
      project.project_users_ids.push(user_id);
    }

    await project.save();

    // Create a notification for the invited user
    const notification = new Notification({
      userId: user_id,
      notificationText: `You have been added as ${role} to project "${project.projectName}"`,
    });

    await notification.save();

    req.app.get('io').emit('notification',{ user_Id : notification.userId});

    return res.status(200).json({ message: `User added as ${role} successfully`, project });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

async function getUserProjects(req, res) {
  try {
      const userId = req.user.id;

      const projects = await Project.find({
          $or: [
              { project_admins_ids: userId },
              { project_owners_ids: userId },
              { project_users_ids: userId }
          ]
      });

      return res.status(200).json({ projects });

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error while fetching projects' });
  }
}


async function deleteProject(req, res) {
  try {
      const { project_id } = req.params;
      const userId = req.user.id;

      const project = await Project.findById(project_id);

      if (!project) {
          return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is an admin of the project
      const isAdmin = project.project_admins_ids.includes(userId);
      if (!isAdmin) {
          return res.status(403).json({ message: "Only project admins can delete this project" });
      }

      await Project.findByIdAndDelete(project_id);

      return res.status(200).json({ message: "Project deleted successfully" });

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error while deleting project" });
  }
}


module.exports = {
  createProject,
  addUserToProject,
  getUserProjects,
  deleteProject
};