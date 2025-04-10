const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const projectCommentController = require('../controllers/projectCommentsController');


router.get('/add-comment-project/:projectId', authMiddleware,projectCommentController.commentProject);

router.get('/get-project-comments/:projectId', authMiddleware,projectCommentController.getProjectComments);


module.exports = router;