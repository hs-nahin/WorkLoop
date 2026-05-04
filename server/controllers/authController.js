const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/token');
const admin = require('../firebase-admin');

const login = async (req, res) => {
    try {
        const { userId, password, email } = req.body;
        
        if (email && password) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                const customClaims = userRecord.customClaims || { role: 'USER' };
                
                // Also check Firestore for additional user data
                const db = admin.firestore();
                const userDoc = await db.collection('users').doc(userRecord.uid).get();
                const userData = userDoc.exists ? userDoc.data() : null;
                
                const token = generateToken({ 
                    userId: userRecord.uid, 
                    role: customClaims.role || userData?.role || 'USER',
                    email: userRecord.email 
                });
                
                return res.json({ 
                    token, 
                    user: { 
                        userId: userRecord.uid, 
                        email: userRecord.email,
                        role: customClaims.role || userData?.role || 'USER',
                        name: userData?.name || userRecord.displayName || 'User'
                    } 
                });
            } catch (firebaseError) {
                if (firebaseError.code === 'auth/user-not-found') {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }
            }
        }
        
        if (userId && password) {
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            const user = userDoc.data();
            
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = generateToken(user);
            res.json({ token, user: { userId: user.userId, role: user.role, name: user.name } });
            return;
        }

        return res.status(400).json({ message: 'UserId and password or email and password are required' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        try {
            const userRecord = await admin.auth().getUser(userId);
            const customClaims = userRecord.customClaims || { role: 'USER' };
            
            // Fetch additional data from Firestore
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(userId).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            
            res.json({ 
                userId: userRecord.uid, 
                email: userRecord.email,
                role: customClaims.role || userData?.role || 'USER',
                name: userData?.name || userRecord.displayName || 'User'
            });
            return;
        } catch (firebaseError) {
            console.error('Firebase error:', firebaseError);
        }

        // Fallback to Firestore only
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });
        
        const user = userDoc.data();
        res.json({ userId: user.userId, role: user.role, name: user.name });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, getMe };