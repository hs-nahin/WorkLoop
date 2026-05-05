const express = require('express');
const router = express.Router();
const { adminDb } = require('../firebase-admin');
const { verifyToken, selfOrAdmin } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const snapshot = await adminDb.collection('users').get();
    const users = snapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(u => u.isActive !== false);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:uid', verifyToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await adminDb.doc(`users/${uid}`).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ uid: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:uid/avatar', verifyToken, selfOrAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }

    const { adminStorage } = require('../firebase-admin');
    const bucket = adminStorage;
    const fileName = `avatars/${uid}/${Date.now()}_${req.file.originalname}`;
    
    await bucket.file(fileName).save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });

    const [url] = await bucket.file(fileName).getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000
    });

    await adminDb.doc(`users/${uid}`).update({ avatarUrl: url });

    res.json({ avatarUrl: url });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;