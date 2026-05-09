const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTaskById, updateTask, deleteTask, submitTask, approveTask, rejectTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../config/permissions');

router.route('/')
    .get(protect, getTasks)
    .post(protect, checkPermission('TASK_CREATE'), createTask);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, checkPermission('TASK_EDIT'), updateTask)
    .delete(protect, checkPermission('TASK_DELETE'), deleteTask);

router.patch('/:id/submit', protect, checkPermission('TASK_SUBMIT'), submitTask);
router.patch('/:id/approve', protect, checkPermission('TASK_APPROVE'), approveTask);
router.patch('/:id/reject', protect, checkPermission('TASK_REJECT'), rejectTask);

module.exports = router;
