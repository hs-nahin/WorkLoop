const express = require('express');
const router = express.Router();
const { admin, adminDb } = require('../firebase-admin');
const { verifyToken, writeAuditLog } = require('../middleware/auth');
const { checkPermission } = require('../config/permissions');

// Get announcements based on user role and status
router.get('/', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role;
        const now = new Date();

        const snapshot = await adminDb.collection('announcements')
            .where('active', '==', true)
            .get();

        let announcements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        announcements = announcements.filter(ann => {
            if (!ann.targetRoles || ann.targetRoles.includes('all')) return true;
            return ann.targetRoles.includes(userRole);
        });

        announcements = announcements.filter(ann => {
            if (!ann.startsAt) return true;
            return new Date(ann.startsAt) <= now;
        });

        announcements = announcements.filter(ann => {
            if (!ann.expiresAt) return true;
            return new Date(ann.expiresAt) > now;
        });

        announcements.sort((a, b) => (b.pinned === a.pinned) ? new Date(b.createdAt) - new Date(a.createdAt) : b.pinned - a.pinned);

        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error: error.message });
    }
});

// Mark announcement as read by user
router.post('/:id/read', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.uid;

        await adminDb.collection('announcements').doc(id).collection('readBy').doc(userId).set({
            readAt: admin.firestore.FieldValue.serverTimestamp(),
            userRole: req.user.role
        });

        res.json({ message: 'Announcement marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking announcement as read', error: error.message });
    }
});

// Create announcement
router.post('/', verifyToken, checkPermission('ANNOUNCEMENT_CREATE'), async (req, res) => {
    try {
        const { title, message, type, priority, startsAt, expiresAt, targetRoles, pinned } = req.body;

        if (!title || !message || !type || !priority) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const announcementData = {
            title,
            message,
            type,
            priority,
            startsAt: startsAt || null,
            expiresAt: expiresAt || null,
            targetRoles: targetRoles || ['all'],
            pinned: pinned || false,
            active: true,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('announcements').add(announcementData);

        await writeAuditLog('announcement_created', req.user, {
            targetId: docRef.id,
            targetTitle: title,
            description: `Created announcement: ${title}`,
        });

        const createdDoc = await docRef.get();
        const createdData = createdDoc.data();

        res.status(201).json({ id: docRef.id, ...createdData });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Error creating announcement', error: error.message || 'Unknown error' });
    }
});

// Update announcement
router.put('/:id', verifyToken, checkPermission('ANNOUNCEMENT_EDIT'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.createdAt) delete updates.createdAt;
        if (updates.createdBy) delete updates.createdBy;

        const allowedFields = ['title', 'message', 'type', 'priority', 'startsAt', 'expiresAt', 'targetRoles', 'pinned', 'active'];
        const sanitized = {};
        for (const key of allowedFields) {
          if (updates[key] !== undefined) sanitized[key] = updates[key];
        }

        if (Object.keys(sanitized).length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }

        await adminDb.collection('announcements').doc(id).update(sanitized);

        await writeAuditLog('announcement_updated', req.user, {
            targetId: id,
            description: `Updated announcement ${id}`,
        });

        res.json({ message: 'Announcement updated successfully' });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Error updating announcement', error: error.message || 'Unknown error' });
    }
});

// Delete announcement
router.delete('/:id', verifyToken, checkPermission('ANNOUNCEMENT_DELETE'), async (req, res) => {
    try {
        const { id } = req.params;
        await adminDb.collection('announcements').doc(id).delete();

        await writeAuditLog('announcement_deleted', req.user, {
            targetId: id,
            description: `Deleted announcement ${id}`,
        });

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Error deleting announcement', error: error.message });
    }
});

// Toggle active status
router.patch('/:id/toggle', verifyToken, checkPermission('ANNOUNCEMENT_EDIT'), async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = adminDb.collection('announcements').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ message: 'Announcement not found' });

        const currentStatus = doc.data().active;
        await docRef.update({ active: !currentStatus });

        await writeAuditLog('announcement_status_toggled', req.user, {
            targetId: id,
            description: `Toggled status of announcement ${id} to ${!currentStatus}`,
        });

        res.json({ message: `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Error toggling announcement status:', error);
        res.status(500).json({ message: 'Error toggling announcement status', error: error.message || 'Unknown error' });
    }
});

module.exports = router;
