const express = require('express');
const router = express.Router();
const { admin, adminDb } = require('../firebase-admin');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get announcements based on user role and status
router.get('/', protect, async (req, res) => {
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
router.post('/:id/read', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await adminDb.collection('announcements').doc(id).collection('readBy').doc(userId).set({
            readAt: admin.firestore.FieldValue.serverTimestamp(),
            userRole: req.user.role
        });

        res.json({ message: 'Announcement marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error marking announcement as read', error: error.message });
    }
});

// ADMIN: Create announcement
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
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
            createdBy: req.user.userId || req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('announcements').add(announcementData);

        const userName = req.user.name || req.user.email || 'Unknown User';

        await adminDb.collection('audit-logs').add({
            action: 'ANNOUNCEMENT_CREATED',
            userId: req.user.userId || req.user.uid,
            userName: userName,
            details: `Created announcement: ${title}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        const createdDoc = await docRef.get();
        const createdData = createdDoc.data();

        res.status(201).json({ id: docRef.id, ...createdData });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Error creating announcement', error: error.message || 'Unknown error' });
    }
});

// ADMIN: Update announcement
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.createdAt) delete updates.createdAt;

        await adminDb.collection('announcements').doc(id).update(updates);

        await adminDb.collection('audit-logs').add({
            action: 'ANNOUNCEMENT_UPDATED',
            userId: req.user.userId,
            userName: req.user.name || req.user.email || 'Unknown User',
            details: `Updated announcement ${id}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: 'Announcement updated successfully' });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({ message: 'Error updating announcement', error: error.message || 'Unknown error' });
    }
});

// ADMIN: Delete announcement
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await adminDb.collection('announcements').doc(id).delete();

        await adminDb.collection('audit-logs').add({
            action: 'ANNOUNCEMENT_DELETED',
            userId: req.user.userId,
            userName: req.user.name,
            details: `Deleted announcement ${id}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement', error: error.message });
    }
});

// ADMIN: Toggle active status
router.patch('/:id/toggle', protect, authorize('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const docRef = adminDb.collection('announcements').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return res.status(404).json({ message: 'Announcement not found' });

        const currentStatus = doc.data().active;
        await docRef.update({ active: !currentStatus });

        await adminDb.collection('audit-logs').add({
            action: 'ANNOUNCEMENT_STATUS_TOGGLED',
            userId: req.user.userId,
            userName: req.user.name || req.user.email || 'Unknown User',
            details: `Toggled status of announcement ${id} to ${!currentStatus}`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: `Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
        console.error('Error toggling announcement status:', error);
        res.status(500).json({ message: 'Error toggling announcement status', error: error.message || 'Unknown error' });
    }
});

module.exports = router;
