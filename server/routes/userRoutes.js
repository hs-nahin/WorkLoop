const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('ADMIN'), getUsers)
    .post(protect, authorize('ADMIN'), createUser);

router.route('/:id')
    .put(protect, authorize('ADMIN'), updateUser)
    .delete(protect, authorize('ADMIN'), deleteUser);

module.exports = router;
