const admin = require('firebase-admin');
const { adminDb, adminAuth } = require('../firebase-admin');

const getTasks = async (req, res) => {
    try {
        const tasksSnapshot = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, location, officerId, assistantId, priority, deadline } = req.body;
        
        if (!title || !description || !officerId) {
            return res.status(400).json({ message: 'Title, description and officer are required' });
        }

        // Get officer name
        let officerName = 'Unassigned';
        if (officerId) {
            const officerDoc = await adminDb.collection('users').doc(officerId).get();
            officerName = officerDoc.exists ? officerDoc.data().name : 'Unknown';
        }
        
        // Get assistant name if provided
        let assistantName = null;
        if (assistantId) {
            const assistantDoc = await adminDb.collection('users').doc(assistantId).get();
            assistantName = assistantDoc.exists ? assistantDoc.data().name : null;
        }
        
        const newTask = {
            title,
            description,
            location: location || '',
            officerId,
            officerName,
            assistantId: assistantId || null,
            assistantName,
            status: 'pending',
            priority: priority || 'medium',
            deadline: deadline || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
            completionReport: null,
            adminFeedback: null,
            progressReports: [],
            acceptedAt: null,
            submittedAt: null,
            completedAt: null
        };
        
        const docRef = await adminDb.collection('tasks').add(newTask);
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
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = { id: taskDoc.id, ...taskDoc.data() };
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Accept task (officer accepts a task)
const acceptTask = async (req, res) => {
    try {
        const { id } = req.params;
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = taskDoc.data();
        
        // Only pending tasks can be accepted
        if (task.status !== 'pending') {
            return res.status(400).json({ message: 'Task is not available for acceptance' });
        }
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'accepted',
            acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
            acceptedBy: req.user.uid
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error accepting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add progress report (officer adds progress update)
const addProgressReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Progress message is required' });
        }
        
        const report = {
            message,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reportedBy: req.user.uid
        };
        
        await adminDb.collection('tasks').doc(id).update({
            progressReports: admin.firestore.FieldValue.arrayUnion(report)
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error adding progress report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit task completion (officer submits completed work)
const submitTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { report } = req.body;
        
        if (!report) {
            return res.status(400).json({ message: 'Completion report is required' });
        }
        
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = taskDoc.data();
        
        // Only accepted tasks can be submitted
        if (task.status !== 'accepted' && task.status !== 'rejected') {
            return res.status(400).json({ message: 'Task must be accepted before submission' });
        }
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'submitted',
            completionReport: report,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            submittedBy: req.user.uid
        });
        
        // Create notification for admin
        await adminDb.collection('notifications').add({
            type: 'task_submitted',
            taskId: id,
            taskTitle: task.title,
            message: `Task "${task.title}" has been submitted for review`,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin approve task
const approveTask = async (req, res) => {
    try {
        const { id } = req.params;
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'approved',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminFeedback: null
        });
        
        // Create notification for officer
        const task = taskDoc.data();
        await adminDb.collection('notifications').add({
            type: 'task_approved',
            taskId: id,
            taskTitle: task.title,
            message: `Task "${task.title}" has been approved`,
            userId: task.officerId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error approving task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin reject task with feedback
const rejectTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        
        if (!feedback) {
            return res.status(400).json({ message: 'Feedback is required for rejection' });
        }
        
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'rejected',
            adminFeedback: feedback,
            submittedAt: null,
            completionReport: null
        });
        
        // Create notification for officer
        const task = taskDoc.data();
        await adminDb.collection('notifications').add({
            type: 'task_rejected',
            taskId: id,
            taskTitle: task.title,
            message: `Task "${task.title}" has been rejected. Feedback: ${feedback}`,
            userId: task.officerId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error rejecting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await adminDb.collection('tasks').doc(id).update(updates);
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        await adminDb.collection('tasks').doc(id).delete();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get notifications for admin
const getNotifications = async (req, res) => {
    try {
        const notificationsSnapshot = await adminDb.collection('notifications')
            .where('userId', '==', null)
            .orderBy('createdAt', 'desc')
            .get();
        
        const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get notifications for officer
const getOfficerNotifications = async (req, res) => {
    try {
        const notificationsSnapshot = await adminDb.collection('notifications')
            .where('userId', '==', req.user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await adminDb.collection('notifications').doc(id).update({ read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    getTasks, 
    createTask, 
    getTaskById, 
    acceptTask, 
    addProgressReport, 
    submitTask, 
    approveTask, 
    rejectTask, 
    updateTask, 
    deleteTask, 
    getNotifications, 
    getOfficerNotifications, 
    markNotificationRead
};
