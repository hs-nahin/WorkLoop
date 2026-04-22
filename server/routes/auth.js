const express = require('express');
const router = express.Router();
const { admin, adminAuth, adminDb } = require('../firebase-admin');
const { verifyToken, adminOnly, selfOrAdmin, writeAuditLog } = require('../middleware/auth');

router.post('/create-user', verifyToken, adminOnly, async (req, res) => {
  try {
    const { name, email, password, displayId, role, location } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name
    });

    const userData = {
      uid: userRecord.uid,
      name,
      email,
      displayId: displayId || `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
      role: role.toUpperCase(),
      location: location || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid
    };

    await adminDb.doc(`users/${userRecord.uid}`).set(userData);

    await writeAuditLog('user_created', req.user, {
      targetId: userRecord.uid,
      targetTitle: name,
      description: `Created user: ${email} as ${role}`
    });

    res.status(201).json({ uid: userRecord.uid, ...userData });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
});

router.put('/update-user/:uid', verifyToken, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, displayId, role, location } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name;
      await adminAuth.updateUser(uid, { displayName: name });
    }
    if (displayId) updateData.displayId = displayId;
    if (role) updateData.role = role.toUpperCase();
    if (location !== undefined) updateData.location = location;

    await adminDb.doc(`users/${uid}`).update(updateData);

    await writeAuditLog('user_updated', req.user, {
      targetId: uid,
      targetTitle: name,
      description: 'Updated user profile'
    });

    const updatedDoc = await adminDb.doc(`users/${uid}`).get();
    res.json({ uid, ...updatedDoc.data() });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

router.delete('/delete-user/:uid', verifyToken, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data();

    await adminAuth.deleteUser(uid);
    await adminDb.doc(`users/${uid}`).delete();

    await writeAuditLog('user_deleted', req.user, {
      targetId: uid,
      targetTitle: userData?.name,
      description: 'Deleted user account'
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
});

router.patch('/toggle-user/:uid', verifyToken, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;
    
    const userDoc = await adminDb.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newActiveStatus = !userData.isActive;
    
    await adminAuth.updateUser(uid, { disabled: !newActiveStatus });
    await adminDb.doc(`users/${uid}`).update({ isActive: newActiveStatus });

    await writeAuditLog('user_toggled', req.user, {
      targetId: uid,
      targetTitle: userData.name,
      description: `Account ${newActiveStatus ? 'activated' : 'deactivated'}`
    });

    res.json({ uid, isActive: newActiveStatus });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ message: error.message || 'Failed to toggle user' });
  }
});

router.patch('/reset-password/:uid', verifyToken, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    await adminAuth.updateUser(uid, { password: newPassword });

    await writeAuditLog('password_reset', req.user, {
      targetId: uid,
      description: 'Password reset by admin'
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
});

module.exports = router;