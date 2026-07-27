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
        let tasksSnapshot;
        try {
            tasksSnapshot = await adminDb.collection('tasks').orderBy('createdAt', 'desc').get();
        } catch (indexErr) {
            // Fallback: orderBy may fail if old tasks lack createdAt
            console.warn('orderBy createdAt failed, fetching without ordering:', indexErr.message);
            tasksSnapshot = await adminDb.collection('tasks').get();
        }
        const tasks = tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdByName: data.createdByName || data.createdBy || 'Unknown',
            };
        });
        // Sort by createdAt desc (client-side fallback if Firestore orderBy was skipped)
        tasks.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.()?.getTime?.() || 0;
            const bTime = b.createdAt?.toDate?.()?.getTime?.() || 0;
            return bTime - aTime;
        });
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, location, officerId, assistantId, priority, deadline } = req.body;
        
        if (!title || !officerId) {
            return res.status(400).json({ message: 'Title and assignee are required' });
        }

        let officerName = 'Unassigned';
        let assistantName = null;

        const userLookups = [adminDb.collection('users').doc(officerId).get()];
        if (assistantId) userLookups.push(adminDb.collection('users').doc(assistantId).get());

        const userDocs = await Promise.all(userLookups);
        officerName = userDocs[0].exists ? userDocs[0].data().name : 'Unknown';
        if (assistantId && userDocs[1]) {
            assistantName = userDocs[1].exists ? userDocs[1].data().name : null;
        }
        
        let deadlineTs = null;
        if (deadline) {
            try {
                const d = new Date(deadline);
                if (!isNaN(d.getTime())) {
                    deadlineTs = admin.firestore.Timestamp.fromDate(d);
                }
            } catch (_) {}
        }

        const newTask = {
            title,
            description: description || '',
            location: location || '',
            officerId,
            officerName,
            assistantId: assistantId || null,
            assistantName,
            status: 'pending',
            priority: priority || 'medium',
            deadline: deadlineTs,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
            createdByName: req.user.name || 'Admin',
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

        // Create system message
        await createSystemMessage(docRef.id, `Task "${title}" created by ${req.user.name || 'Admin'} and assigned to ${officerName}${assistantName ? `, collaborator: ${assistantName}` : ''}`);

        // Audit trail
        try {
            await writeAuditLog('task_created', req.user, {
                targetId: docRef.id,
                targetTitle: title,
                description: `${req.user.name || 'Admin'} created task "${title}" and assigned to ${officerName}`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }

        // Create notifications for assigned users
        const notifyUsers = [officerId];
        if (assistantId) notifyUsers.push(assistantId);
        
        const notificationPromises = notifyUsers.map(userId =>
            adminDb.collection('notifications').add({
                type: 'task_assigned',
                taskId: docRef.id,
                taskTitle: title,
                message: userId === officerId
                    ? `You have been assigned a new task: "${title}"`
                    : `You have been added as a collaborator on: "${title}"`,
                userId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            })
        );
        await Promise.all(notificationPromises);

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
        const uid = req.user.uid;
        const role = (req.user.role || '').toUpperCase();

        // ADMIN or TASK_VIEW_ALL can see everything
        if (role === 'ADMIN') {
            return res.json(task);
        }

        // Check if user is officer, assistant, or creator of this task
        if (task.officerId === uid || task.assistantId === uid || task.createdBy === uid) {
            return res.json(task);
        }

        // Check permission
        const { hasPermission } = require('../config/permissions');
        if (hasPermission(role, 'TASK_VIEW_ALL', uid)) {
            return res.json(task);
        }

        return res.status(403).json({ message: 'Access denied' });
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
        await createSystemMessage(id, `Task accepted by ${req.user.name || 'User'} - status changed to In Progress`);

        // Audit trail
        try {
            await writeAuditLog('task_accepted', req.user, {
                targetId: id,
                targetTitle: task.title,
                description: `${req.user.name || 'User'} accepted task "${task.title}"`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
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
                    message: `Task "${task.title}" has been accepted by ${req.user.name || 'User'}`,
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

        // Create system message for progress report
        await createSystemMessage(id, `Progress report added by ${req.user.name || 'User'}: "${message}"`);

        // Create notifications for admins
        const progressAllUsersSnapshot = await adminDb.collection('users').get();
        const progressAdminDocs = progressAllUsersSnapshot.docs.filter(d => {
            const role = (d.data().role || '').toUpperCase();
            return role === 'ADMIN';
        });

        const progressTaskDoc = await adminDb.collection('tasks').doc(id).get();
        const progressTaskData = progressTaskDoc.exists ? progressTaskDoc.data() : {};
        
        if (progressAdminDocs.length > 0) {
            const progressNotificationPromises = progressAdminDocs.map(adminDoc => {
                return adminDb.collection('notifications').add({
                    type: 'progress_report',
                    taskId: id,
                    taskTitle: progressTaskData.title || 'Task',
                    message: `${req.user.name || 'User'} added a progress report on "${progressTaskData.title || 'Task'}"`,
                    userId: adminDoc.id,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await Promise.all(progressNotificationPromises);
        }

        // Audit trail
        try {
            await writeAuditLog('progress_added', req.user, {
                targetId: id,
                targetTitle: progressTaskData.title || 'Unknown',
                description: `${req.user.name || 'User'} added progress report on task "${progressTaskData.title || 'Unknown'}"`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
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
        await createSystemMessage(id, `Task submitted by ${req.user.name || 'User'} - status changed to Submitted`);

        // Audit trail
        try {
            await writeAuditLog('task_submitted', req.user, {
                targetId: id,
                targetTitle: task.title,
                description: `${req.user.name || 'User'} submitted task "${task.title}" for review`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
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
        await createSystemMessage(id, `Task marked as Incomplete by ${req.user.name || 'User'}`);

        // Audit trail
        try {
            await writeAuditLog('task_incomplete', req.user, {
                targetId: id,
                targetTitle: task.title,
                description: `${req.user.name || 'User'} marked task "${task.title}" as incomplete`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }

        // Create notifications for admins
        const incompleteAllUsersSnapshot = await adminDb.collection('users').get();
        const incompleteAdminDocs = incompleteAllUsersSnapshot.docs.filter(d => {
            const role = (d.data().role || '').toUpperCase();
            return role === 'ADMIN';
        });

        if (incompleteAdminDocs.length > 0) {
            const incompleteNotificationPromises = incompleteAdminDocs.map(adminDoc => {
                return adminDb.collection('notifications').add({
                    type: 'task_incomplete',
                    taskId: id,
                    taskTitle: task.title,
                    message: `Task "${task.title}" has been marked as incomplete by ${req.user.name || 'User'}`,
                    userId: adminDoc.id,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await Promise.all(incompleteNotificationPromises);
        }
        
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

        const task = taskDoc.data();

        // Create system message for status change
        await createSystemMessage(id, `Task approved by ${req.user.name || 'Admin'} - status changed to Completed`);

        // Audit trail
        try {
            await writeAuditLog('task_approved', req.user, {
                targetId: id,
                targetTitle: task.title,
                description: `${req.user.name || 'Admin'} approved task "${task.title}"`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
        // Create notification for officer + collaborator
        const notificationMessage = feedback 
            ? `Task "${task.title}" has been approved. Feedback: ${feedback}`
            : `Task "${task.title}" has been approved and completed`;
        
        const notifyUsers = [task.officerId];
        if (task.assistantId) notifyUsers.push(task.assistantId);
        
        const notificationPromises = notifyUsers.map(userId =>
            adminDb.collection('notifications').add({
                type: 'task_approved',
                taskId: id,
                taskTitle: task.title,
                message: notificationMessage,
                userId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            })
        );
        await Promise.all(notificationPromises);
        
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

        // Create notification for officer + collaborator
        const task = taskDoc.data();

        // Audit trail
        try {
            await writeAuditLog('task_rejected', req.user, {
                targetId: id,
                targetTitle: task.title,
                description: `${req.user.name || 'Admin'} rejected task "${task.title}" with feedback: ${feedback}`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }

        const rejectMsg = `Task "${task.title}" has been rejected. Feedback: ${feedback}`;
        const notifyUsers = [task.officerId];
        if (task.assistantId) notifyUsers.push(task.assistantId);
        
        const notificationPromises = notifyUsers.map(userId =>
            adminDb.collection('notifications').add({
                type: 'task_rejected',
                taskId: id,
                taskTitle: task.title,
                message: rejectMsg,
                userId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            })
        );
        await Promise.all(notificationPromises);
        
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
        const updates = { ...req.body };

        // Convert deadline string to Firestore Timestamp if present
        if (updates.deadline) {
            try {
                const d = new Date(updates.deadline);
                if (!isNaN(d.getTime())) {
                    updates.deadline = admin.firestore.Timestamp.fromDate(d);
                }
            } catch (_) {}
        }

        // Prevent overwriting server-managed fields
        delete updates.createdBy;
        delete updates.createdAt;

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

        // Get task data before deleting for audit log
        const taskDoc = await adminDb.collection('tasks').doc(id).get();
        const taskData = taskDoc.exists ? taskDoc.data() : null;

        await adminDb.collection('tasks').doc(id).delete();

        // Audit trail
        try {
            await writeAuditLog('task_deleted', req.user, {
                targetId: id,
                targetTitle: taskData?.title || 'Unknown',
                description: `${req.user.name || 'Admin'} deleted task "${taskData?.title || 'Unknown'}"`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get notifications for any user
const getNotifications = async (req, res) => {
    try {
        const notificationsSnapshot = await adminDb.collection('notifications')
            .where('userId', '==', req.user.uid)
            .get();
        
        const notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort client-side (avoids needing a composite index)
        notifications.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
        });
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

        // Audit trail
        const parentTaskDoc = await adminDb.collection('tasks').doc(taskId).get();
        const parentTaskData = parentTaskDoc.exists ? parentTaskDoc.data() : {};
        try {
            await writeAuditLog('subtask_created', req.user, {
                targetId: taskId,
                targetTitle: parentTaskData.title || 'Unknown',
                description: `${req.user.name || 'User'} created subtask "${title}" assigned to ${userData.name || 'user'}`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
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

            // Audit trail for subtask status change
            const parentDoc = await adminDb.collection('tasks').doc(taskId).get();
            const parentData = parentDoc.exists ? parentDoc.data() : {};
            try {
                await writeAuditLog('subtask_updated', req.user, {
                    targetId: taskId,
                    targetTitle: parentData.title || 'Unknown',
                    description: `${req.user.name || 'User'} changed subtask "${subtask.title}" status to ${updates.status}`
                });
            } catch (auditError) {
                console.error('Error writing audit log:', auditError);
            }
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

        // Audit trail
        const delParentDoc = await adminDb.collection('tasks').doc(taskId).get();
        const delParentData = delParentDoc.exists ? delParentDoc.data() : {};
        try {
            await writeAuditLog('subtask_deleted', req.user, {
                targetId: taskId,
                targetTitle: delParentData.title || 'Unknown',
                description: `${req.user.name || 'User'} deleted subtask "${subtaskTitle}"`
            });
        } catch (auditError) {
            console.error('Error writing audit log:', auditError);
        }
        
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
            (task && task.officerId === req.user.uid) ||
            (task && task.assistantId === req.user.uid);
        
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

// Alias: officer notifications use the same logic (both filter by userId)
const getOfficerNotifications = getNotifications;

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
