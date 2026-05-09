const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../config/permissions');

router.route('/')
    .get(protect, checkPermission('USER_LIST'), getUsers)
    .post(protect, checkPermission('USER_CREATE'), createUser);

router.route('/:id')
    .put(protect, checkPermission('USER_EDIT'), updateUser)
    .delete(protect, checkPermission('USER_DELETE'), deleteUser);

module.exports = router;
