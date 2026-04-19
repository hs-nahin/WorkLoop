const FileHandler = require('../utils/fileHandler');
const { protect, authorize } = require('../middleware/authMiddleware');

const taskStore = new FileHandler('tasks.json');

const getTasks = async (req, res) => {
    try {
        const tasks = await taskStore.read();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, location, officerId, assistants, priority, deadline } = req.body;
        
        if (!title || !description || !officerId) {
            return res.status(400).json({ message: 'Title, description and officer are required' });
        }

        const tasks = await taskStore.read();
        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            location,
            officerId,
            assistants: assistants || [],
            status: 'pending',
            priority,
            deadline,
            createdAt: new Date().toISOString(),
            completionReport: null,
            adminFeedback: null
        };

        tasks.push(newTask);
        await taskStore.write(tasks);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const tasks = await taskStore.read();
        const task = tasks.find(t => t.id === id);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const tasks = await taskStore.read();
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return res.status(404).json({ message: 'Task not found' });

        tasks[index] = { ...tasks[index], ...updates };
        await taskStore.write(tasks);
        res.json(tasks[index]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const tasks = await taskStore.read();
        const filteredTasks = tasks.filter(t => t.id !== id);
        if (tasks.length === filteredTasks.length) return res.status(404).json({ message: 'Task not found' });
        await taskStore.write(filteredTasks);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const submitTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { report } = req.body;
        if (!report) return res.status(400).json({ message: 'Completion report is required' });

        const tasks = await taskStore.read();
        const task = tasks.find(t => t.id === id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Only assigned officer can submit
        if (task.officerId !== req.user.userId) {
            return res.status(403).json({ message: 'Only the assigned officer can submit this report' });
        }

        task.status = 'submitted';
        task.completionReport = report;
        
        await taskStore.write(tasks);
        res.json({ message: 'Task submitted successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const decideTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, feedback } = req.body; // decision: 'approved' or 'rejected'
        if (!decision || !feedback) return res.status(400).json({ message: 'Decision and feedback are required' });

        const tasks = await taskStore.read();
        const task = tasks.find(t => t.id === id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.status = decision === 'approved' ? 'approved' : 'rejected';
        task.adminFeedback = feedback;

        await taskStore.write(tasks);
        res.json({ message: `Task ${decision} successfully`, task });
    } catch (error) {
        res.status(500).json({ message: 'Task decision processed' });
    }
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask, submitTask, decideTask };
