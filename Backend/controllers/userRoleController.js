const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

exports.updateRole = [
    body('role').isIn(['admin', 'TeamLeader', 'Member', 'user']).trim().escape(),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { role } = req.body;
            console.log('Role update request received with role:', role);
            console.log('User from request:', req.user);

            // Extract user ID from different possible token structures
            const userId = req.user.id || req.user._id || (req.user.user && req.user.user.id);

            if (!userId) {
                console.error('User ID not found in token. User object:', req.user);
                return res.status(400).json({ message: 'User ID not found in token' });
            }

            console.log('Using user ID:', userId);

            // Find the user by ID
            console.log('Finding user with ID:', userId);
            let user;
            try {
                user = await User.findById(userId);
                console.log('User found:', user ? 'Yes' : 'No');
            } catch (findError) {
                console.error('Error finding user:', findError);
                return res.status(500).json({ message: 'Error finding user', error: findError.message });
            }

            if (!user) {
                console.error('User not found with ID:', userId);
                return res.status(404).json({ message: 'User not found' });
            }

            // Update the user's role
            console.log('Updating user role to:', role);
            user.role = role;

            try {
                await user.save();
                console.log('User role updated successfully');
            } catch (saveError) {
                console.error('Error saving user:', saveError);
                return res.status(500).json({ message: 'Error saving user', error: saveError.message });
            }

            // Create a new token with the updated role
            console.log('Creating new token with updated role');
            const payload = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.username || `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                isVerified: user.isVerified,
                googleAuth: user.googleAuth || false
            };

            console.log('Token payload:', payload);

            // Sign the token
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) {
                        console.error('Error signing token:', err);
                        return res.status(500).json({ message: 'Error creating token', error: err.message });
                    }

                    console.log('Token created successfully');
                    res.json({
                        message: 'Role updated successfully',
                        token,
                        role: user.role
                    });
                }
            );
        } catch (error) {
            console.error('Error updating role:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }
];
