const BlacklistedToken = require('../models/BlacklistedToken.model');
const { verifyToken } = require('../utils/jwt.util');

const authMiddleware = (roles) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers?.authorization || req.body?.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Access denied. No token provided.' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ message: 'Invalid or expired token' });
            }

            // Check if token is blacklisted
            const isBlacklisted = await BlacklistedToken.findOne({ token });
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Token has been blacklisted' });
            }

            // Optional: Validate user type
            if (roles.length > 0 && !roles.includes(decoded.type)) {
                return res.status(403).json({ message: `Unauthorized: Expected one of ${roles.join(', ')}, but got ${decoded.type}` });
            }

            req.user = {
                _id: decoded.id,
                role: decoded.type,
                ...decoded
            };
            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(500).json({ message: 'Server error during authentication' });
        }
    };
};

module.exports = authMiddleware;
