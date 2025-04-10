const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const projectController = require('../controllers/projectController');


router.post('/create-project', authMiddleware,  projectController.createProject);

router.post('/add-user-project/:project_id/:user_id', authMiddleware, projectController.addUserToProject);

router.get('/my-projects', authMiddleware, projectController.getUserProjects);

router.delete('/delete/:project_id', authMiddleware, projectController.deleteProject);

module.exports = router;