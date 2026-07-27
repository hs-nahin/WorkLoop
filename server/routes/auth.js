const express = require('express');
const router = express.Router();
const { admin, adminAuth, adminDb } = require('../firebase-admin');
const { verifyToken, selfOrAdmin, writeAuditLog } = require('../middleware/auth');
const { checkPermission, refreshUserCache } = require('../config/permissions');

const DEFAULT_EMAIL_DOMAIN = 'workloop.local';

const getEmailDomain = async () => {
  try {
    const doc = await adminDb.doc('company/config').get();
    return doc.exists ? (doc.data().emailDomain || DEFAULT_EMAIL_DOMAIN) : DEFAULT_EMAIL_DOMAIN;
  } catch {
    return DEFAULT_EMAIL_DOMAIN;
  }
};

const userIdToEmail = async (userId) => {
  const domain = await getEmailDomain();
  return `${userId}@${domain}`;
};

const normalizeRole = (role) => {
  if (!role) return 'USER';
  return role.toUpperCase();
};

// AUTHENTICATED: Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    let userDoc = await adminDb.doc(`users/${req.user.uid}`).get();

    if (!userDoc.exists && req.user.email) {
      const snapshot = await adminDb.collection('users').where('email', '==', req.user.email).limit(1).get();
      if (!snapshot.empty) {
        const oldDoc = snapshot.docs[0];
        const oldData = oldDoc.data();
        await adminDb.doc(`users/${req.user.uid}`).set(oldData);
        await oldDoc.ref.delete();
        userDoc = await adminDb.doc(`users/${req.user.uid}`).get();
      }
    }

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    const data = userDoc.data();
    res.json({
      uid: userDoc.id,
      name: data.name || '',
      email: data.email || '',
      userId: data.userId || userDoc.id,
      displayId: data.displayId || data.userId || userDoc.id,
      role: normalizeRole(data.role),
      location: data.location || '',
      designation: data.designation || '',
      isActive: data.isActive !== false,
      isSystemAdmin: data.isSystemAdmin || false,
      avatarUrl: data.avatarUrl || '',
      createdAt: data.createdAt || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// PUBLIC: Register a new Admin account
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    let existingAdmin = false;
    try {
      await adminAuth.getUserByEmail(email);
      existingAdmin = true;
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    if (existingAdmin) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const userData = {
      uid: userRecord.uid,
      name,
      email,
      userId: email.split('@')[0],
      role: 'ADMIN',
      isActive: true,
      isSystemAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userRecord.uid,
    };

    await adminDb.doc(`users/${userRecord.uid}`).set(userData);

    res.status(201).json({
      uid: userRecord.uid,
      name,
      email,
      role: 'ADMIN',
      message: 'Admin account created successfully',
    });
  } catch (error) {
    console.error('Register admin error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    res.status(500).json({ message: error.message || 'Failed to create admin account' });
  }
});

// ADMIN: Create a new user account
router.post('/create-user', verifyToken, checkPermission('USER_CREATE'), async (req, res) => {
  try {
    const { name, userId, password, displayId, location, designation, role: userRole } = req.body;

    if (!name || !userId || !password) {
      return res.status(400).json({ message: 'Name, User ID, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userIdRegex = /^[a-zA-Z0-9._-]+$/;
    if (!userIdRegex.test(userId)) {
      return res.status(400).json({ message: 'User ID can only contain letters, numbers, dots, hyphens, and underscores' });
    }

    const email = await userIdToEmail(userId);

    let existingUser = false;
    try {
      await adminAuth.getUserByEmail(email);
      existingUser = true;
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    if (existingUser) {
      return res.status(409).json({ message: `A user with User ID "${userId}" already exists` });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    const userData = {
      name,
      email,
      userId,
      displayId: displayId || userId,
      role: normalizeRole(userRole),
      location: location || '',
      designation: designation || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    await adminDb.doc(`users/${userRecord.uid}`).set(userData);

    await writeAuditLog('user_created', req.user, {
      targetId: userRecord.uid,
      targetTitle: name,
      description: `Created user: ${name} (ID: ${userId})`,
    });

    res.status(201).json({ uid: userRecord.uid, ...userData });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'A user with these credentials already exists' });
    }
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
});

// ADMIN: List all users
router.get('/users', verifyToken, checkPermission('USER_LIST'), async (req, res) => {
  try {
    const { search, location, designation, role } = req.query;
    const snapshot = await adminDb.collection('users').get();
    let users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.userId || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.displayId || '').toLowerCase().includes(q)
      );
    }

    if (location) {
      users = users.filter(u => (u.location || '').toLowerCase() === location.toLowerCase());
    }

    if (designation) {
      users = users.filter(u => (u.designation || '').toLowerCase() === designation.toLowerCase());
    }

    if (role) {
      users = users.filter(u => (u.role || '').toLowerCase() === role.toLowerCase());
    }

    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: error.message || 'Failed to list users' });
  }
});

// ADMIN: Update user
router.put('/update-user/:uid', verifyToken, checkPermission('USER_EDIT'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, displayId, location, designation, role: userRole } = req.body;

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
      try {
        await adminAuth.updateUser(uid, { displayName: name });
      } catch (e) {
        console.error('Warning: Failed to update Firebase Auth displayName:', e.message);
      }
    }
    if (displayId !== undefined) updateData.displayId = displayId;
    if (location !== undefined) updateData.location = location;
    if (designation !== undefined) updateData.designation = designation;
    if (userRole !== undefined) updateData.role = normalizeRole(userRole);

    await adminDb.doc(`users/${uid}`).update(updateData);

    await writeAuditLog('user_updated', req.user, {
      targetId: uid,
      targetTitle: name || uid,
      description: `Updated user: ${name || uid}`,
    });

    const updatedDoc = await adminDb.doc(`users/${uid}`).get();
    res.json({ uid, ...updatedDoc.data() });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

// AUTHENTICATED: Update own profile (name only — self-service)
router.patch('/update-profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const trimmed = name.trim();
    let userDoc = await adminDb.doc(`users/${req.user.uid}`).get();

    if (!userDoc.exists && req.user.email) {
      const snapshot = await adminDb.collection('users').where('email', '==', req.user.email).limit(1).get();
      if (!snapshot.empty) {
        const oldDoc = snapshot.docs[0];
        const oldData = oldDoc.data();
        await adminDb.doc(`users/${req.user.uid}`).set(oldData);
        await oldDoc.ref.delete();
        userDoc = await adminDb.doc(`users/${req.user.uid}`).get();
      }
    }

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    await adminDb.doc(`users/${req.user.uid}`).update({ name: trimmed });
    try {
      await adminAuth.updateUser(req.user.uid, { displayName: trimmed });
    } catch (e) {
      console.error('Warning: Failed to update Firebase Auth displayName:', e.message);
    }

    const updatedDoc = await adminDb.doc(`users/${req.user.uid}`).get();
    const data = updatedDoc.data();
    res.json({
      uid: updatedDoc.id,
      name: data.name,
      email: data.email,
      userId: data.userId,
      displayId: data.displayId,
      role: normalizeRole(data.role),
      location: data.location,
      designation: data.designation,
      isActive: data.isActive !== false,
      isSystemAdmin: data.isSystemAdmin || false,
      avatarUrl: data.avatarUrl || '',
      createdAt: data.createdAt || null,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ADMIN: Delete user (removes from Firebase Auth + Firestore)
router.delete('/delete-user/:uid', verifyToken, checkPermission('USER_DELETE'), async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    if (userData.isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot delete a system administrator' });
    }

    try {
      await adminAuth.deleteUser(uid);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        console.error('Error deleting Firebase Auth user:', e);
      }
    }

    await adminDb.doc(`users/${uid}`).delete();

    await writeAuditLog('user_deleted', req.user, {
      targetId: uid,
      targetTitle: userData.name,
      description: `Deleted user: ${userData.name || uid}`,
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
});

// ADMIN: Toggle user active status
router.patch('/toggle-user/:uid', verifyToken, checkPermission('USER_TOGGLE'), async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    if (userData.isSystemAdmin) {
      return res.status(403).json({ message: 'Cannot toggle a system administrator' });
    }

    const currentActive = userData.isActive !== false;
    const newActiveStatus = !currentActive;

    try {
      await adminAuth.updateUser(uid, { disabled: !newActiveStatus });
    } catch (e) {
      if (e.code !== 'auth/user-not-found') {
        console.error('Error updating Firebase Auth user:', e);
      }
    }

    await adminDb.doc(`users/${uid}`).update({ isActive: newActiveStatus });

    await refreshUserCache(uid);

    await writeAuditLog('user_toggled', req.user, {
      targetId: uid,
      targetTitle: userData.name,
      description: `Account ${newActiveStatus ? 'activated' : 'deactivated'}: ${userData.name || uid}`,
    });

    res.json({ uid, isActive: newActiveStatus });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ message: error.message || 'Failed to toggle user' });
  }
});

// ADMIN: Reset user password
router.patch('/reset-password/:uid', verifyToken, checkPermission('USER_PASSWORD_RESET'), async (req, res) => {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const userDoc = await adminDb.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    try {
      await adminAuth.updateUser(uid, { password: newPassword });
    } catch (e) {
      return res.status(404).json({ message: 'User not found in authentication system' });
    }

    await writeAuditLog('password_reset', req.user, {
      targetId: uid,
      description: `Password reset for: ${userData.name || uid}`,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Failed to reset password' });
  }
});

module.exports = router;
