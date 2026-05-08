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
            workStartedAt: null,
            submittedAt: null,
            completedAt: null,
            totalDurationSeconds: null,
            isTimerRunning: false
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
        
        const now = admin.firestore.Timestamp.now();
        await adminDb.collection('tasks').doc(id).update({
            status: 'in progress',
            acceptedAt: now,
            acceptedBy: req.user.uid,
            workStartedAt: now,
            isTimerRunning: true,
            totalDurationSeconds: 0
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
        
        // Only in progress tasks can be submitted
        if (task.status !== 'in progress') {
            return res.status(400).json({ message: 'Task must be in progress before submission' });
        }
        
        const now = admin.firestore.Timestamp.now();
        const sessionDuration = task.workStartedAt 
            ? (now.toMillis() - task.workStartedAt.toMillis()) / 1000 
            : 0;
        const totalDuration = (task.totalDurationSeconds || 0) + sessionDuration;
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'submitted',
            completionReport: report,
            submittedAt: now,
            submittedBy: req.user.uid,
            totalDurationSeconds: totalDuration,
            isTimerRunning: false
        });
        
        // Create notifications for all admins
        const adminQuery = await adminDb.collection('users').where('role', '==', 'ADMIN').get();
        
        if (!adminQuery.empty) {
            const notificationsPromises = adminQuery.docs.map(adminDoc => {
                return adminDb.collection('notifications').add({
                    type: 'task_submitted',
                    taskId: id,
                    taskTitle: task.title,
                    message: `Task "${task.title}" has been submitted for review`,
                    userId: adminDoc.id,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await Promise.all(notificationsPromises);
        }
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark task as incomplete (officer marks task as incomplete)
const incompleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const task = taskDoc.data();
        
        // Only in progress tasks can be marked as incomplete
        if (task.status !== 'in progress') {
            return res.status(400).json({ message: 'Only in progress tasks can be marked as incomplete' });
        }
        
        const now = admin.firestore.Timestamp.now();
        const sessionDuration = task.workStartedAt 
            ? (now.toMillis() - task.workStartedAt.toMillis()) / 1000 
            : 0;
        const totalDuration = (task.totalDurationSeconds || 0) + sessionDuration;
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'incomplete',
            completedAt: now,
            totalDurationSeconds: totalDuration,
            isTimerRunning: false
        });
        
        const updatedDoc = await adminDb.collection('tasks').doc(id).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error marking task as incomplete:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin approve task - moves to completed
const approveTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        await adminDb.collection('tasks').doc(id).update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminFeedback: feedback || null,
            isTimerRunning: false
        });
        
        // Create notification for officer
        const task = taskDoc.data();
        const notificationMessage = feedback 
            ? `Task "${task.title}" has been approved. Feedback: ${feedback}`
            : `Task "${task.title}" has been approved and completed`;
        
        await adminDb.collection('notifications').add({
            type: 'task_approved',
            taskId: id,
            taskTitle: task.title,
            message: notificationMessage,
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

// Admin reject task with feedback - returns to in progress
const rejectTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { feedback } = req.body;
        
        if (!feedback) {
            return res.status(400).json({ message: 'Feedback is required for rejection' });
        }
        
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });
        
        const now = admin.firestore.Timestamp.now();
        await adminDb.collection('tasks').doc(id).update({
            status: 'in progress',
            adminFeedback: feedback,
            submittedAt: null,
            workStartedAt: now,
            isTimerRunning: true
            // Keep completionReport and progressReports for officer to review
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
    incompleteTask,
    submitTask, 
    approveTask, 
    rejectTask, 
    updateTask, 
    deleteTask, 
    getNotifications, 
    getOfficerNotifications, 
    markNotificationRead
};
