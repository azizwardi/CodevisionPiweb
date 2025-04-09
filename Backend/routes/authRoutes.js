const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController');
const loginController = require('../controllers/loginController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', registerController.register);
router.post('/login', loginController.login);
router.post('/logout', loginController.logout);
router.get('/verify-email', registerController.verifyEmail);
router.post('/resend-verification-email', registerController.resendVerificationEmail);
router.delete('/delete-account', authMiddleware, loginController.deleteAccount);
router.post('/request-password-reset', loginController.requestPasswordReset);
router.post('/reset-password', loginController.resetPassword);

module.exports = router;