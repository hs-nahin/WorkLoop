const express = require('express');
const router = express.Router();
const { adminDb } = require('../firebase-admin');
const { verifyToken, adminOnly, writeAuditLog } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    let query = adminDb.collection('tasks').orderBy('createdAt', 'desc');
    
    const { status, priority, location } = req.query;
    
    if (req.user.role.toUpperCase() === 'ADMIN') {
      if (status) query = query.where('status', '==', status);
      if (priority) query = query.where('priority', '==', priority);
      if (location) query = query.where('location', '==', location);
    } else {
      query = query.where('assignedOfficerUid', '==', req.user.uid);
      if (status) query = query.where('status', '==', status);
      if (priority) query = query.where('priority', '==', priority);
    }

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, description, location, assignedOfficerUid, assistantUids, priority, deadline, notes } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let officerName = 'Unassigned';
    if (assignedOfficerUid) {
      const officerDoc = await adminDb.doc(`users/${assignedOfficerUid}`).get();
      officerName = officerDoc.exists ? officerDoc.data().name : 'Unknown';
    }

    const assistantNames = [];
    if (assistantUids && assistantUids.length) {
      for (const uid of assistantUids) {
        const aDoc = await adminDb.doc(`users/${uid}`).get();
        if (aDoc.exists) assistantNames.push(aDoc.data().name);
      }
    }

    const taskData = {
      title,
      description,
      location: location || '',
      assignedOfficerUid: assignedOfficerUid || null,
      assignedOfficerName: officerName,
      assistantUids: assistantUids || [],
      assistantNames,
      priority: priority || 'medium',
      status: 'pending',
      deadline: deadline || null,
      notes: notes || '',
      completionReport: null,
      adminFeedback: null,
      createdByUid: req.user.uid,
      createdByName: req.user.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await adminDb.collection('tasks').add(taskData);

    await writeAuditLog('task_created', req.user, {
      targetId: docRef.id,
      targetTitle: title,
      description: `Created task: ${title}`
    });

    res.status(201).json({ id: docRef.id, ...taskData });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const taskDoc = await adminDb.doc(`tasks/${id}`).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskData = taskDoc.data();

    if (req.user.role.toUpperCase() !== 'ADMIN' && taskData.assignedOfficerUid !== req.user.uid) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ id: doc.id, ...taskData });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedUpdates = ['title', 'description', 'location', 'assignedOfficerUid', 'assistantUids', 'priority', 'deadline', 'notes'];
    const updateData = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    if (updates.assignedOfficerUid) {
      const officerDoc = await adminDb.doc(`users/${updates.assignedOfficerUid}`).get();
      updateData.assignedOfficerName = officerDoc.exists ? officerDoc.data().name : 'Unknown';
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await adminDb.doc(`tasks/${id}`).update(updateData);

    await writeAuditLog('task_updated', req.user, {
      targetId: id,
      description: 'Updated task'
    });

    const updatedDoc = await adminDb.doc(`tasks/${id}`).get();
    res.json({ id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const taskDoc = await adminDb.doc(`tasks/${id}`).get();
    const taskData = taskDoc.data();

    await adminDb.doc(`tasks/${id}`).delete();

    await writeAuditLog('task_deleted', req.user, {
      targetId: id,
      targetTitle: taskData?.title,
      description: 'Deleted task'
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/start', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const taskDoc = await adminDb.doc(`tasks/${id}`).get();
    const taskData = taskDoc.data();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (taskData.assignedOfficerUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the assigned officer can start this task' });
    }

    if (taskData.status !== 'pending') {
      return res.status(400).json({ message: 'Task cannot be started from current status' });
    }

    await adminDb.doc(`tasks/${id}`).update({
      status: 'in_progress',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await writeAuditLog('task_started', req.user, {
      targetId: id,
      targetTitle: taskData.title,
      description: 'Started working on task'
    });

    const updatedDoc = await adminDb.doc(`tasks/${id}`).get();
    res.json({ id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/submit', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { problemDescription, stepsTaken, toolsUsed, currentStatus, remainingIssues, completionType } = req.body;

    const taskDoc = await adminDb.doc(`tasks/${id}`).get();
    const taskData = taskDoc.data();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (taskData.assignedOfficerUid !== req.user.uid) {
      return res.status(403).json({ message: 'Only the assigned officer can submit this report' });
    }

    if (taskData.status !== 'in_progress') {
      return res.status(400).json({ message: 'Task must be in progress to submit' });
    }

    const completionReport = {
      problemDescription,
      stepsTaken,
      toolsUsed: toolsUsed || '',
      currentStatus,
      remainingIssues: remainingIssues || '',
      completionType: completionType || 'full',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await adminDb.doc(`tasks/${id}`).update({
      status: 'submitted',
      completionReport,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await writeAuditLog('task_submitted', req.user, {
      targetId: id,
      targetTitle: taskData.title,
      description: 'Submitted completion report'
    });

    const updatedDoc = await adminDb.doc(`tasks/${id}`).get();
    res.json({ id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/decide', verifyToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, message } = req.body;

    if (!decision || !['approved', 'rejected', 'revisit'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }

    const taskDoc = await adminDb.doc(`tasks/${id}`).get();
    const taskData = taskDoc.data();

    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const adminFeedback = {
      decision,
      message: message || '',
      decidedByUid: req.user.uid,
      decidedByName: req.user.name,
      decidedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await adminDb.doc(`tasks/${id}`).update({
      status: decision,
      adminFeedback,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await writeAuditLog(`task_${decision}`, req.user, {
      targetId: id,
      targetTitle: taskData.title,
      description: `Task ${decision}`
    });

    const updatedDoc = await adminDb.doc(`tasks/${id}`).get();
    res.json({ id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Decide task error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;