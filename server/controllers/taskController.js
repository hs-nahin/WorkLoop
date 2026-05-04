const admin = require('../firebase-admin');

const getTasks = async (req, res) => {
    try {
        const db = admin.firestore();
        const tasksSnapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, location, officerId, assistants, priority, deadline } = req.body;
        
        if (!title || !description || !officerId) {
            return res.status(400).json({ message: 'Title, description and officer are required' });
        }

        const db = admin.firestore();
        const newTask = {
            title,
            description,
            location: location || '',
            officerId,
            assistants: assistants || [],
            status: 'pending',
            priority: priority || 'medium',
            deadline: deadline || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.userId,
            completionReport: null,
            adminFeedback: null
        };

        const docRef = await db.collection('tasks').add(newTask);
        const createdTask = { id: docRef.id, ...newTask };
        res.status(201).json(createdTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        const taskDoc = await db.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = { id: taskDoc.id, ...taskDoc.data() };
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const db = admin.firestore();
        
        await db.collection('tasks').doc(id).update(updates);
        const updatedDoc = await db.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const db = admin.firestore();
        
        await db.collection('tasks').doc(id).delete();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const submitTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { report } = req.body;
        if (!report) return res.status(400).json({ message: 'Completion report is required' });

        const db = admin.firestore();
        const taskDoc = await db.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = taskDoc.data();
        
        // Only assigned officer can submit
        if (task.officerId !== req.user.userId) {
            return res.status(403).json({ message: 'Only the assigned officer can submit this report' });
        }

        await db.collection('tasks').doc(id).update({
            status: 'submitted',
            completionReport: report
        });
        
        const updatedDoc = await db.collection('tasks').doc(id).get();
        res.json({ message: 'Task submitted successfully', task: { id, ...updatedDoc.data() } });
    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const decideTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, feedback } = req.body;
        if (!decision || !feedback) return res.status(400).json({ message: 'Decision and feedback are required' });

        const db = admin.firestore();
        const taskDoc = await db.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

        const status = decision === 'approved' ? 'approved' : 'rejected';
        
        await db.collection('tasks').doc(id).update({
            status,
            adminFeedback: feedback
        });

        const updatedDoc = await db.collection('tasks').doc(id).get();
        res.json({ message: `Task ${decision} successfully`, task: { id, ...updatedDoc.data() } });
    } catch (error) {
        console.error('Error deciding task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask, submitTask, decideTask };
