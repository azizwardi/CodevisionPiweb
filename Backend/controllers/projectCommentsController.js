const ProjectComment = require("../models/projectComment");
const Project = require("../models/project");
const User = require("../models/user");

async function commentProject(req, res) {
    try {
        const { projectId } = req.params;
        const { commentText } = req.body;
        const userId = req.user.id;

        if (!commentText) {
            return res.status(400).json({ message: "Comment text is required" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const comment = new ProjectComment({
            userId,
            commentText,
            projectId
        });

        await comment.save();

        req.app.get('io').emit('comment',{projectId : comment.projectId});


        res.status(201).json({
            message: "Comment added successfully",
            comment
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while commenting project" });
    }
}


async function getProjectComments(req, res) {
    try {
        const { projectId } = req.params;

        const comments = await ProjectComment.find({ projectId })
            .sort({ createdAt: -1 }) 
            .populate('userId', 'username'); 

        // Format the response
        const formatted = comments.map(comment => ({
            username: comment.userId.username,
            commentText: comment.commentText
        }));

        return res.status(200).json({ comments: formatted });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while retrieving comments" });
    }
}




module.exports = {
    commentProject,
    getProjectComments
};
