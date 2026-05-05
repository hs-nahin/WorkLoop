const bcrypt = require('bcryptjs');
const admin = require('../firebase-admin');

const getUsers = async (req, res) => {
    try {
        const db = admin.firestore();
        const usersSnapshot = await db.collection('users').get();
        
        // If no users in Firestore, try to get from Firebase Auth
        if (usersSnapshot.empty) {
            try {
                const authUsers = await admin.auth().listUsers();
                const users = authUsers.users.map(user => ({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email?.split('@')[0] || 'Unknown',
                    role: 'IT OFFICER', // Default role
                    userId: user.uid
                }));
                return res.json(users);
            } catch (authError) {
                console.error('Error fetching from Auth:', authError);
                return res.json([]);
            }
        }
        
        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            // Don't return passwords
            const { password, ...safeUser } = data;
            // Use uid from data if available, otherwise use doc.id
            return { uid: data.uid || doc.id, userId: data.uid || doc.id, ...safeUser, id: doc.id };
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { userId, name, password, role } = req.body;
        if (!userId || !name || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const db = admin.firestore();
        
        // Check if user already exists
        const existingUser = await db.collection('users').doc(userId).get();
        if (existingUser.exists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { userId, name, password: hashedPassword, role };
        
        await db.collection('users').doc(userId).set(newUser);

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = admin.firestore();

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        await db.collection('users').doc(id).update(updates);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        
        await db.collection('users').doc(id).delete();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
