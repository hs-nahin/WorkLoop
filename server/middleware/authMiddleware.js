const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/token');
const admin = require('../firebase-admin');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        let decoded;
        try {
            const decodedFirebase = await admin.auth().verifyIdToken(token);
            decoded = {
                userId: decodedFirebase.uid,
                email: decodedFirebase.email,
                role: 'USER'
            };
        } catch (firebaseError) {
            try {
                decoded = verifyToken(token);
            } catch (jwtError) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Role not authorized' });
        }
        next();
    };
};

module.exports = { protect, authorize };