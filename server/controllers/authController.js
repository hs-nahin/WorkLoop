const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const FileHandler = require('../utils/fileHandler');
const { generateToken, verifyToken } = require('../utils/token');

const userStore = new FileHandler('users.json');

const login = async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) {
            return res.status(400).json({ message: 'UserId and password are required' });
        }

        const users = await userStore.read();
        const user = users.find(u => u.userId === userId);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ token, user: { userId: user.userId, role: user.role, name: user.name } });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const users = await userStore.read();
        const user = users.find(u => u.userId === userId);
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ userId: user.userId, role: user.role, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, getMe };
