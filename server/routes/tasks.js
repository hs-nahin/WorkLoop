const express = require('express');
const router = express.Router();
const { 
    getTasks, 
    createTask, 
    getTaskById, 
    acceptTask,
    addProgressReport,
    submitTask,
    approveTask,
    rejectTask,
    updateTask, 
    deleteTask 
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

module.exports = router;
