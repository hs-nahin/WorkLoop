const admin = require('firebase-admin');
const { adminDb, adminAuth } = require('../firebase-admin');
const { writeAuditLog } = require('../middleware/auth');

// Helper to create system messages in task discussion thread
const createSystemMessage = async (taskId, message) => {
  try {
    await adminDb.collection('tasks').doc(taskId).collection('messages').add({
      text: message,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'SYSTEM',
      senderAvatar: null,
      attachmentUrl: null,
      type: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating system message:', error);
  }
};

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

        // Create system message for status change
        await createSystemMessage(id, `Task accepted by ${req.user.name || 'Officer'} - status changed to In Progress`);
        
        // Create notifications for all admins that task has been accepted
        const allUsersSnapshot = await adminDb.collection('users').get();
        const adminDocs = allUsersSnapshot.docs.filter(d => {
            const role = (d.data().role || '').toUpperCase();
            return role === 'ADMIN';
        });
        
        if (adminDocs.length > 0) {
            const notificationsPromises = adminDocs.map(adminDoc => {
                return adminDb.collection('notifications').add({
                    type: 'task_accepted',
                    taskId: id,
                    taskTitle: task.title,
                    message: `Task "${task.title}" has been accepted by ${req.user.name || 'Officer'}`,
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

        // Create system message for status change
        await createSystemMessage(id, `Task submitted by ${req.user.name || 'Officer'} - status changed to Submitted`);
        
        // Create notifications for all admins
        const allUsersSnapshot = await adminDb.collection('users').get();
        const adminDocs = allUsersSnapshot.docs.filter(d => {
            const role = (d.data().role || '').toUpperCase();
            return role === 'ADMIN';
        });
        
        if (adminDocs.length > 0) {
            const notificationsPromises = adminDocs.map(adminDoc => {
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

        // Create system message for status change
        await createSystemMessage(id, `Task marked as Incomplete by ${req.user.name || 'Officer'}`);
        
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

        // Create system message for status change
        await createSystemMessage(id, `Task approved by ${req.user.name || 'Admin'} - status changed to Completed`);
        
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

        // Create system message for status change
        await createSystemMessage(id, `Task rejected by ${req.user.name || 'Admin'} - status changed to In Progress. Feedback: ${feedback}`);
        
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

// Subtask CRUD for Assistant Workflow
const createSubtask = async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const { title, description, assignedUserId, deadline } = req.body;

        if (!title || !assignedUserId) {
            return res.status(400).json({ message: 'Title and assigned user are required' });
        }

        // Verify task exists
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        if (!taskDoc.exists) return res.status(404).json({ message: 'Task not found' });

        // Get assigned user details
        const userDoc = await adminDb.collection('users').doc(assignedUserId).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'Assigned user not found' });
        const userData = userDoc.data();

        const newSubtask = {
            title,
            description: description || '',
            assignedUserId,
            assignedUserName: userData.name || 'Unknown',
            assignedUserRole: (userData.role || 'USER').toUpperCase(),
            status: 'pending',
            deadline: deadline || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await adminDb.collection('tasks').doc(taskId).collection('subtasks').add(newSubtask);
        
        // Create system message for subtask creation
        await createSystemMessage(taskId, `Subtask "${title}" created and assigned to ${userData.name || 'user'}`);
        
        const createdSubtask = { id: docRef.id, ...newSubtask };
        res.status(201).json(createdSubtask);
    } catch (error) {
        console.error('Error creating subtask:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getSubtasks = async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const subtasksSnapshot = await adminDb.collection('tasks').doc(taskId).collection('subtasks')
            .orderBy('createdAt', 'asc')
            .get();
        
        const subtasks = subtasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(subtasks);
    } catch (error) {
        console.error('Error fetching subtasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSubtask = async (req, res) => {
    try {
        const { id: taskId, subtaskId } = req.params;
        const updates = req.body;

        // Only allow updating status, description, deadline, assigned user
        const allowedUpdates = ['status', 'description', 'deadline', 'assignedUserId', 'assignedUserName', 'assignedUserRole'];
        const filteredUpdates = {};
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });
        filteredUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await adminDb.collection('tasks').doc(taskId).collection('subtasks').doc(subtaskId).update(filteredUpdates);
        
        // Create system message for subtask status change
        if (updates.status) {
            const subtaskDoc = await adminDb.collection('tasks').doc(taskId).collection('subtasks').doc(subtaskId).get();
            const subtask = subtaskDoc.data();
            await createSystemMessage(taskId, `Subtask "${subtask.title}" status changed to ${updates.status}`);
        }

        const updatedDoc = await adminDb.collection('tasks').doc(taskId).collection('subtasks').doc(subtaskId).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        console.error('Error updating subtask:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteSubtask = async (req, res) => {
    try {
        const { id: taskId, subtaskId } = req.params;
        
        // Get subtask title for system message
        const subtaskDoc = await adminDb.collection('tasks').doc(taskId).collection('subtasks').doc(subtaskId).get();
        const subtaskTitle = subtaskDoc.exists ? subtaskDoc.data().title : 'Unknown';
        
        await adminDb.collection('tasks').doc(taskId).collection('subtasks').doc(subtaskId).delete();
        
        // Create system message
        await createSystemMessage(taskId, `Subtask "${subtaskTitle}" deleted`);
        
        res.json({ message: 'Subtask deleted successfully' });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Attachment Version Control Functions
const getFileBaseName = (filename) => {
    // Remove version suffix like -v1, -v2, etc. and extension
    return filename.replace(/-\d+$/, '').replace(/\.[^/.]+$/, '');
};

const getNextVersion = async (taskId, baseFileName) => {
    try {
        const attachmentsSnapshot = await adminDb.collection('tasks').doc(taskId).collection('attachments')
            .where('baseFileName', '==', baseFileName)
            .orderBy('version', 'desc')
            .limit(1)
            .get();
        
        if (attachmentsSnapshot.empty) return 1;
        const latest = attachmentsSnapshot.docs[0].data();
        return (latest.version || 0) + 1;
    } catch (error) {
        console.error('Error getting next version:', error);
        return 1;
    }
};

const createAttachment = async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const { fileName, fileUrl, fileSize, fileType, notes } = req.body;

        console.log('Create attachment - Task ID:', taskId);
        console.log('Create attachment - File:', fileName, fileUrl);

        if (!fileName || !fileUrl) {
            return res.status(400).json({ message: 'fileName and fileUrl are required' });
        }

        // Verify task exists
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        if (!taskDoc.exists) {
            console.log('Task not found:', taskId);
            return res.status(404).json({ message: 'Task not found' });
        }
        const taskData = taskDoc.data();

        const baseFileName = getFileBaseName(fileName);
        const version = await getNextVersion(taskId, baseFileName);

        const newAttachment = {
            fileName,
            baseFileName,
            fileUrl,
            fileSize: fileSize || null,
            fileType: fileType || null,
            uploadedBy: req.user.uid,
            uploaderName: req.user.name || 'Unknown',
            uploaderRole: (req.user.role || 'USER').toUpperCase(),
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            version,
            notes: notes || null
        };

        const docRef = await adminDb.collection('tasks').doc(taskId).collection('attachments').add(newAttachment);
        
        console.log('Attachment created successfully:', docRef.id);
        
        // Create system message for attachment upload
        try {
            await createSystemMessage(taskId, `${req.user.name || 'User'} uploaded ${fileName} (v${version})`);
        } catch (msgError) {
            console.error('Error creating system message:', msgError);
        }
        
        // Audit trail
        try {
            await writeAuditLog('attachment_uploaded', req.user, {
                targetId: taskId,
                targetTitle: taskData.title,
                description: `${req.user.name || 'User'} uploaded ${fileName} (v${version})`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
        const createdAttachment = { id: docRef.id, ...newAttachment };
        res.status(201).json(createdAttachment);
    } catch (error) {
        console.error('Error creating attachment:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

const getAttachments = async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const attachmentsSnapshot = await adminDb.collection('tasks').doc(taskId).collection('attachments')
            .orderBy('uploadedAt', 'desc')
            .get();
        
        const attachments = attachmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(attachments);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteAttachment = async (req, res) => {
    try {
        const { id: taskId, attachmentId } = req.params;
        
        // Get attachment details for system message
        const attachmentDoc = await adminDb.collection('tasks').doc(taskId).collection('attachments').doc(attachmentId).get();
        if (!attachmentDoc.exists) return res.status(404).json({ message: 'Attachment not found' });
        
        const attachmentData = attachmentDoc.data();
        
        // Check permissions: uploader, officer assigned to task, or admin
        const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
        const task = taskDoc.exists ? taskDoc.data() : null;
        
        const canDelete = 
            req.user.uid === attachmentData.uploadedBy ||
            req.user.role === 'ADMIN' ||
            (task && task.officerId === req.user.uid);
        
        if (!canDelete) {
            return res.status(403).json({ message: 'Insufficient permissions to delete this attachment' });
        }
        
        await adminDb.collection('tasks').doc(taskId).collection('attachments').doc(attachmentId).delete();
        
        // Create system message
        await createSystemMessage(taskId, `Attachment "${attachmentData.fileName}" (v${attachmentData.version}) was deleted`);
        
        // Audit trail
        await writeAuditLog('attachment_deleted', req.user, {
            targetId: taskId,
            targetTitle: task?.title || 'Unknown',
            description: `${req.user.name || 'User'} deleted "${attachmentData.fileName}" (v${attachmentData.version})`
        });
        
        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Error deleting attachment:', error);
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
    markNotificationRead,
    createSubtask,
    getSubtasks,
    updateSubtask,
    deleteSubtask,
    createAttachment,
    getAttachments,
    deleteAttachment
};
