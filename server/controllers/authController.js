const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const FileHandler = require('../utils/fileHandler');
const { generateToken, verifyToken } = require('../utils/token');
const admin = require('../firebase-admin');

const userStore = new FileHandler('users.json');

const login = async (req, res) => {
    try {
        const { userId, password, email } = req.body;
        
        if (email && password) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                const customClaims = userRecord.customClaims || { role: 'USER' };
                
                const token = generateToken({ 
                    userId: userRecord.uid, 
                    role: customClaims.role || 'USER',
                    email: userRecord.email 
                });
                
                return res.json({ 
                    token, 
                    user: { 
                        userId: userRecord.uid, 
                        email: userRecord.email,
                        role: customClaims.role || 'USER' 
                    } 
                });
            } catch (firebaseError) {
                if (firebaseError.code === 'auth/user-not-found') {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            }
        }
        
        if (userId && password) {
            const users = await userStore.read();
            const user = users.find(u => u.userId === userId);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = generateToken(user);
            res.json({ token, user: { userId: user.userId, role: user.role, name: user.name } });
            return;
        }

        return res.status(400).json({ message: 'UserId and password or email and password are required' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        try {
            const userRecord = await admin.auth().getUser(userId);
            const customClaims = userRecord.customClaims || { role: 'USER' };
            res.json({ 
                userId: userRecord.uid, 
                email: userRecord.email,
                role: customClaims.role || 'USER' 
            });
            return;
        } catch (firebaseError) {
        }

        const users = await userStore.read();
        const user = users.find(u => u.userId === userId);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ userId: user.userId, role: user.role, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, getMe };