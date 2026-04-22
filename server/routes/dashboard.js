const express = require('express');
const router = express.Router();
const { adminDb } = require('../firebase-admin');
const { verifyToken } = require('../middleware/auth');

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const tasksSnapshot = await adminDb.collection('tasks').get();
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      submitted: tasks.filter(t => t.status === 'submitted').length,
      approved: tasks.filter(t => t.status === 'approved').length,
      rejected: tasks.filter(t => t.status === 'rejected').length,
      revisit: tasks.filter(t => t.status === 'revisit').length,
      totalUsers: (await adminDb.collection('users').get()).size
    };

    if (req.user.role.toUpperCase() !== 'ADMIN') {
      const myTasks = tasks.filter(t => t.assignedOfficerUid === req.user.uid);
      return res.json({
        myTasks: myTasks.length,
        inProgress: myTasks.filter(t => t.status === 'in_progress').length,
        submitted: myTasks.filter(t => t.status === 'submitted').length,
        approved: myTasks.filter(t => t.status === 'approved').length
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/recent', verifyToken, async (req, res) => {
  try {
    let query = adminDb.collection('tasks').orderBy('createdAt', 'desc').limit(10);
    
    if (req.user.role.toUpperCase() !== 'ADMIN') {
      query = query.where('assignedOfficerUid', '==', req.user.uid);
    }

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    console.error('Recent tasks error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;