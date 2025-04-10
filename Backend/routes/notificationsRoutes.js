const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.get('/get-user-notifications', authMiddleware,notificationController.getUserNotification);

router.put('/view-notification/:notificationId', authMiddleware, notificationController.markNotificationAsViewed);


module.exports = router;