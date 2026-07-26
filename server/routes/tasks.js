const express = require('express');
const router = express.Router();
const { adminDb } = require('../firebase-admin');
const { 
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
} = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');
const { checkPermission } = require('../config/permissions');

// Get all tasks
router.get('/', verifyToken, getTasks);

// Create new task (admin only)
router.post('/', verifyToken, checkPermission('TASK_CREATE'), createTask);

// Notification routes MUST be before /:id to avoid route collision
router.get('/notifications', verifyToken, checkPermission('NOTIFICATIONS_ADMIN_VIEW'), getNotifications);
router.get('/notifications/officer', verifyToken, checkPermission('NOTIFICATIONS_OFFICER_VIEW'), getOfficerNotifications);
router.patch('/notifications/:id/read', verifyToken, markNotificationRead);
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await adminDb.collection('notifications').doc(id).delete();
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get task by ID (must be after static routes to avoid matching /notifications as :id)
router.get('/:id', verifyToken, getTaskById);

// Accept task (officer accepts task)
router.patch('/:id/accept', verifyToken, checkPermission('TASK_ACCEPT'), acceptTask);

// Add progress report
router.patch('/:id/progress', verifyToken, checkPermission('TASK_ADD_PROGRESS'), addProgressReport);

// Mark task as incomplete
router.patch('/:id/incomplete', verifyToken, checkPermission('TASK_MARK_INCOMPLETE'), incompleteTask);

// Submit task completion
router.patch('/:id/submit', verifyToken, checkPermission('TASK_SUBMIT'), submitTask);

// Admin approve task
router.patch('/:id/approve', verifyToken, checkPermission('TASK_APPROVE'), approveTask);

// Admin reject task
router.patch('/:id/reject', verifyToken, checkPermission('TASK_REJECT'), rejectTask);

// Update task (admin only)
router.put('/:id', verifyToken, checkPermission('TASK_EDIT'), updateTask);

// Delete task (admin only)
router.delete('/:id', verifyToken, checkPermission('TASK_DELETE'), deleteTask);

// Subtask routes (Assistant Workflow)
router.post('/:id/subtasks', verifyToken, checkPermission('SUBTASK_CREATE'), createSubtask);
router.get('/:id/subtasks', verifyToken, getSubtasks);
router.patch('/:id/subtasks/:subtaskId', verifyToken, updateSubtask);
router.delete('/:id/subtasks/:subtaskId', verifyToken, checkPermission('SUBTASK_DELETE'), deleteSubtask);

// Attachment routes (Version Control)
router.post('/:id/attachments', verifyToken, createAttachment);
router.get('/:id/attachments', verifyToken, getAttachments);
router.delete('/:id/attachments/:attachmentId', verifyToken, deleteAttachment);

module.exports = router;
