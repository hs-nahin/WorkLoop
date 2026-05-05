require('dotenv').config();
const { admin, adminDb } = require('../firebase-admin');

async function initFirestore() {
  try {
    const doc = await adminDb.doc('company/config').get();
    
    if (!doc.exists) {
      await adminDb.doc('company/config').set({
        companyName: 'WorkLoop',
        logoUrl: '',
        appTitle: 'WorkLoop',
        primaryColor: '#2563eb',
        locations: ['Shed-01', 'Shed-02', 'Shed-03', 'Office-A']
      });
      console.log('✓ Firestore initialized with default company config');
    } else {
      console.log('✓ Company config already exists');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
}

initFirestore();