const express = require('express');
const router = express.Router();
const { admin, adminDb } = require('../firebase-admin');
const { verifyToken, writeAuditLog } = require('../middleware/auth');
const { DEFAULT_ROLE_PERMISSIONS } = require('../config/permissions');

// ADMIN: List all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await adminDb.collection('roles').get();
    const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const role of roles) {
      if (!role.defaultPermissions) {
        const permDoc = await adminDb.doc(`rolePermissions/${role.id}`).get();
        role.defaultPermissions = { ...DEFAULT_ROLE_PERMISSIONS, ...(permDoc.exists ? permDoc.data() : {}) };
      }
    }

    res.json(roles);
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ message: error.message || 'Failed to list roles' });
  }
});

// ADMIN: Create a new role
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, defaultPermissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const roleId = name.trim().toUpperCase().replace(/\s+/g, '_');

    if (roleId === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot create a role named ADMIN' });
    }

    const existing = await adminDb.doc(`roles/${roleId}`).get();
    if (existing.exists) {
      return res.status(409).json({ message: `Role "${name}" already exists` });
    }

    const roleData = {
      name: name.trim(),
      description: description || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    await adminDb.doc(`roles/${roleId}`).set(roleData);

    if (defaultPermissions && typeof defaultPermissions === 'object') {
      await adminDb.doc(`rolePermissions/${roleId}`).set({ ...DEFAULT_ROLE_PERMISSIONS, ...defaultPermissions });
    } else {
      await adminDb.doc(`rolePermissions/${roleId}`).set(DEFAULT_ROLE_PERMISSIONS);
    }

    await writeAuditLog('role_created', req.user, {
      targetId: roleId,
      targetTitle: name,
      description: `Created role: ${name}`,
    });

    res.status(201).json({ id: roleId, ...roleData });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: error.message || 'Failed to create role' });
  }
});

// ADMIN: Update a role's name/description
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (id === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot rename the Admin role' });
    }

    const roleDoc = await adminDb.doc(`roles/${id}`).get();
    if (!roleDoc.exists) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length > 0) {
      await adminDb.doc(`roles/${id}`).update(updateData);
    }

    await writeAuditLog('role_updated', req.user, {
      targetId: id,
      targetTitle: name || id,
      description: `Updated role: ${name || id}`,
    });

    res.json({ id, ...roleDoc.data(), ...updateData });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: error.message || 'Failed to update role' });
  }
});

// ADMIN: Save role default permissions
router.put('/:id/permissions', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Permissions object is required' });
    }

    const roleDoc = await adminDb.doc(`roles/${id}`).get();
    if (!roleDoc.exists) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await adminDb.doc(`rolePermissions/${id}`).set(permissions);

    await writeAuditLog('role_permissions_updated', req.user, {
      targetId: id,
      targetTitle: roleDoc.data().name,
      description: `Updated permissions for role: ${roleDoc.data().name}`,
    });

    res.json({ id, permissions });
  } catch (error) {
    console.error('Save role permissions error:', error);
    res.status(500).json({ message: error.message || 'Failed to save role permissions' });
  }
});

// ADMIN: Load per-user permission overrides
router.get('/users/:uid/permissions', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await adminDb.doc(`userPermissions/${uid}`).get();
    const permissions = doc.exists ? doc.data() : {};
    res.json({ uid, permissions });
  } catch (error) {
    console.error('Load user permissions error:', error);
    res.status(500).json({ message: error.message || 'Failed to load user permissions' });
  }
});

// ADMIN: Save per-user permission overrides
router.put('/users/:uid/permissions', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ message: 'Permissions object is required' });
    }

    await adminDb.doc(`userPermissions/${uid}`).set(permissions);

    await writeAuditLog('user_permissions_updated', req.user, {
      targetId: uid,
      targetTitle: uid,
      description: `Updated permission overrides for user: ${uid}`,
    });

    res.json({ uid, permissions });
  } catch (error) {
    console.error('Save user permissions error:', error);
    res.status(500).json({ message: error.message || 'Failed to save user permissions' });
  }
});

// ADMIN: Delete a role
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete the Admin role' });
    }

    const roleDoc = await adminDb.doc(`roles/${id}`).get();
    if (!roleDoc.exists) {
      return res.status(404).json({ message: 'Role not found' });
    }

    await adminDb.doc(`roles/${id}`).delete();

    try {
      await adminDb.doc(`rolePermissions/${id}`).delete();
    } catch (_) {}

    await writeAuditLog('role_deleted', req.user, {
      targetId: id,
      targetTitle: roleDoc.data().name,
      description: `Deleted role: ${roleDoc.data().name}`,
    });

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete role' });
  }
});

module.exports = router;
