const express = require('express');
const router = express.Router();
const { adminDb, adminStorage } = require('../firebase-admin');
const { verifyToken, adminOnly, writeAuditLog } = require('../middleware/auth');

const DEFAULT_COMPANY = {
  companyName: 'WorkLoop',
  logoUrl: '',
  appTitle: 'WorkLoop',
  primaryColor: '#2563eb',
  locations: ['Shed-01', 'Shed-02', 'Office-A']
};

router.get('/', async (req, res) => {
  try {
    const doc = await adminDb.doc('company/config').get();
    if (doc.exists) {
      return res.json({ id: doc.id, ...doc.data() });
    }
    res.json(DEFAULT_COMPANY);
  } catch (error) {
    console.error('Get company error:', error);
    res.json(DEFAULT_COMPANY);
  }
});

router.put('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { companyName, appTitle, primaryColor, locations } = req.body;

    const updateData = {};
    if (companyName) updateData.companyName = companyName;
    if (appTitle) updateData.appTitle = appTitle;
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (locations) updateData.locations = locations;

    await adminDb.doc('company/config').set(updateData, { merge: true });

    await writeAuditLog('company_updated', req.user, {
      description: 'Updated company settings'
    });

    const updatedDoc = await adminDb.doc('company/config').get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/logo', verifyToken, adminOnly, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size must be less than 5MB' });
    }

    const bucket = adminStorage;
    const fileName = `logos/company-logo`;
    
    await bucket.file(fileName).save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });

    const [url] = await bucket.file(fileName).getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000
    });

    await adminDb.doc('company/config').update({ logoUrl: url });

    await writeAuditLog('logo_uploaded', req.user, {
      description: 'Uploaded company logo'
    });

    res.json({ logoUrl: url });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;