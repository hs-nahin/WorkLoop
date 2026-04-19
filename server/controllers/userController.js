const bcrypt = require('bcryptjs');
const FileHandler = require('../utils/fileHandler');
const { protect, authorize } = require('../middleware/authMiddleware');

const userStore = new FileHandler('users.json');

const getUsers = async (req, res) => {
    try {
        const users = await userStore.read();
        // Don't return passwords
        const safeUsers = users.map(({ password, ...rest }) => rest);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createUser = async (req, res) => {
    try {
        const { userId, name, password, role } = req.body;
        if (!userId || !name || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const users = await userStore.read();
        if (users.find(u => u.userId === userId)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { userId, name, password: hashedPassword, role };
        
        users.push(newUser);
        await userStore.write(users);

        res.status(201).json({ message: 'User created successfully', userId: newUser.userId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const users = await userStore.read();
        const index = users.findIndex(u => u.userId === id);

        if (index === -1) return res.status(404).json({ message: 'User not found' });

        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        users[index] = { ...users[index], ...updates };
        await userStore.write(users);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const users = await userStore.read();
        const filteredUsers = users.filter(u => u.userId !== id);

        if (users.length === filteredUsers.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userStore.write(filteredUsers);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
