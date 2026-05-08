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
  deleteSubtask
} = require('../controllers/taskController');
const { verifyToken, authorize } = require('../middleware/auth');

// Get all tasks
router.get('/', verifyToken, getTasks);

// Create new task (admin only)
router.post('/', verifyToken, authorize(['ADMIN']), createTask);

// Get task by ID
router.get('/:id', verifyToken, getTaskById);

// Accept task (officer accepts task)
router.patch('/:id/accept', verifyToken, authorize(['IT OFFICER', 'ASSISTANT']), acceptTask);

// Add progress report
router.patch('/:id/progress', verifyToken, authorize(['IT OFFICER', 'ASSISTANT']), addProgressReport);

// Mark task as incomplete
router.patch('/:id/incomplete', verifyToken, authorize(['IT OFFICER', 'ASSISTANT']), incompleteTask);

// Submit task completion
router.patch('/:id/submit', verifyToken, authorize(['IT OFFICER', 'ASSISTANT']), submitTask);

// Admin approve task
router.patch('/:id/approve', verifyToken, authorize(['ADMIN']), approveTask);

// Admin reject task
router.patch('/:id/reject', verifyToken, authorize(['ADMIN']), rejectTask);

// Update task (admin only)
router.put('/:id', verifyToken, authorize(['ADMIN']), updateTask);

// Delete task (admin only)
router.delete('/:id', verifyToken, authorize(['ADMIN']), deleteTask);

// Get notifications for admin
router.get('/notifications', verifyToken, authorize(['ADMIN']), getNotifications);

// Get notifications for officer
router.get('/notifications/officer', verifyToken, authorize(['IT OFFICER', 'ASSISTANT']), getOfficerNotifications);

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
router.post('/:id/subtasks', verifyToken, authorize(['ADMIN', 'IT OFFICER']), createSubtask);

// Get all subtasks for a task
router.get('/:id/subtasks', verifyToken, getSubtasks);

// Update subtask (assigned user can update status, officers/admins can update all)
router.patch('/:id/subtasks/:subtaskId', verifyToken, updateSubtask);

// Delete subtask (officers/admins only)
router.delete('/:id/subtasks/:subtaskId', verifyToken, authorize(['ADMIN', 'IT OFFICER']), deleteSubtask);

module.exports = router;
