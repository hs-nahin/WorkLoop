const express = require('express');
const router = express.Router();
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

// Get task by ID
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

// Get notifications for admin
router.get('/notifications', verifyToken, checkPermission('NOTIFICATIONS_ADMIN_VIEW'), getNotifications);

// Get notifications for officer
router.get('/notifications/officer', verifyToken, checkPermission('NOTIFICATIONS_OFFICER_VIEW'), getOfficerNotifications);

// Mark notification as read
router.patch('/notifications/:id/read', verifyToken, markNotificationRead);

// Delete notification
router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await require('../config/firebase').adminDb.collection('notifications').doc(id).delete();
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Subtask routes (Assistant Workflow)
// Create subtask (officers/admins only)
router.post('/:id/subtasks', verifyToken, checkPermission('SUBTASK_CREATE'), createSubtask);

// Get all subtasks for a task
router.get('/:id/subtasks', verifyToken, getSubtasks);

// Update subtask (assigned user can update status, officers/admins can update all)
router.patch('/:id/subtasks/:subtaskId', verifyToken, updateSubtask);

// Delete subtask (officers/admins only)
router.delete('/:id/subtasks/:subtaskId', verifyToken, checkPermission('SUBTASK_DELETE'), deleteSubtask);

// Attachment routes (Version Control)
// Create attachment metadata (after uploading to Storage)
router.post('/:id/attachments', verifyToken, createAttachment);

// Get all attachments for a task
router.get('/:id/attachments', verifyToken, getAttachments);

// Delete attachment (uploader, officer of task, or admin)
router.delete('/:id/attachments/:attachmentId', verifyToken, deleteAttachment);

module.exports = router;
