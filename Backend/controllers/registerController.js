const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const generateVerificationToken = require('../utils/generateVerificationToken');
const { body, validationResult } = require('express-validator');

exports.register = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).trim().escape(),
    body('firstName').isLength({ min: 2 }).trim().escape(),
    body('lastName').isLength({ min: 2 }).trim().escape(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const { verificationToken, verificationTokenExpires } = generateVerificationToken();

            user = new User({
                firstName,
                lastName,
                email,
                password: hashedPassword,
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
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Server error' });
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
