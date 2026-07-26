const express = require('express');
const router = express.Router();
const { adminDb } = require('../firebase-admin');
const { verifyToken, writeAuditLog } = require('../middleware/auth');

const SYSTEM_ROLES = ['ADMIN', 'USER'];

// ADMIN: List all roles
router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await adminDb.collection('roles').get();
    const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const role of roles) {
      if (!role.defaultPermissions) {
        const permDoc = await adminDb.doc(`rolePermissions/${role.id}`).get();
        role.defaultPermissions = permDoc.exists ? permDoc.data() : {};
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

    if (SYSTEM_ROLES.includes(roleId)) {
      return res.status(400).json({ message: `Cannot create a role with reserved name "${name}"` });
    }

    const existing = await adminDb.doc(`roles/${roleId}`).get();
    if (existing.exists) {
      return res.status(409).json({ message: `Role "${name}" already exists` });
    }

    const roleData = {
      name: name.trim(),
      description: description || '',
      isSystem: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.uid,
    };

    await adminDb.doc(`roles/${roleId}`).set(roleData);

    if (defaultPermissions && typeof defaultPermissions === 'object') {
      await adminDb.doc(`rolePermissions/${roleId}`).set(defaultPermissions);
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

    const roleDoc = await adminDb.doc(`roles/${id}`).get();
    if (!roleDoc.exists) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const roleData = roleDoc.data();
    if (roleData.isSystem && SYSTEM_ROLES.includes(id)) {
      return res.status(400).json({ message: 'Cannot rename system roles' });
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

    res.json({ id, ...roleData, ...updateData });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: error.message || 'Failed to update role' });
  }
});

// ADMIN: Delete a custom role
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const roleDoc = await adminDb.doc(`roles/${id}`).get();
    if (!roleDoc.exists) {
      return res.status(404).json({ message: 'Role not found' });
    }

    if (roleDoc.data().isSystem || SYSTEM_ROLES.includes(id)) {
      return res.status(400).json({ message: 'Cannot delete system roles' });
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
