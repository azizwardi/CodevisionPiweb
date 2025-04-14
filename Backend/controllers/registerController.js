const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');
const generateVerificationToken = require('../utils/generateVerificationToken');
const { body, validationResult } = require('express-validator');
const path = require('path');

exports.register = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).trim().escape(),
    body('firstName').isLength({ min: 2 }).trim().escape(),
    body('lastName').isLength({ min: 2 }).trim().escape(),
    body('username').isLength({ min: 2 }).trim().escape(),
    body('phoneNumber').optional().isMobilePhone().trim().escape(),
    body('role').optional().isIn(['admin', 'TeamLeader', 'member', 'user']).trim().escape(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, username, phoneNumber, role } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { verificationToken, verificationTokenExpires } = generateVerificationToken();

            user = new User({
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
                phoneNumber,
                role,
                verificationToken,
                verificationTokenExpires
            });

            await user.save();
            await sendEmail(user.email, verificationToken);

            res.status(201).json({ message: 'User registered successfully. Please check your email for confirmation.' });
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];



exports.verifyEmail = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.sendFile(path.join(__dirname, '../public', 'token_invalid.html'));
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();
        // Send the verification.html file upon successful verification
        return res.sendFile(path.join(__dirname, '../public', 'verification.html'));
    } catch (error) {
        console.error('Error verifying email:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.resendVerificationEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token and expiration date
        const { verificationToken, verificationTokenExpires } = generateVerificationToken();

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;

        await user.save();

        // Send the verification email again
        await sendEmail(user.email, verificationToken);

        res.json({ message: 'Verification email resent successfully' });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
