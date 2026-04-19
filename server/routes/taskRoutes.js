const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTaskById, updateTask, deleteTask, submitTask, decideTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTasks)
    .post(protect, authorize('ADMIN'), createTask);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, authorize('ADMIN'), updateTask)
    .delete(protect, authorize('ADMIN'), deleteTask);

router.patch('/:id/submit', protect, authorize('IT OFFICER'), submitTask);
router.patch('/:id/decide', protect, authorize('ADMIN'), decideTask);

module.exports = router;
