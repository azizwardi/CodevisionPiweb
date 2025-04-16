const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Check for token in session or Authorization header
    let token = req.session?.token;

    // If no token in session, check Authorization header
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Handle different token structures
        if (decoded.user) {
            // Token has user object
            req.user = decoded.user;
        } else {
            // Token has direct user properties
            req.user = decoded;
        }

        console.log('Auth middleware - User from token:', req.user);
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;