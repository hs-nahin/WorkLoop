const { admin, adminAuth, adminDb } = require('../firebase-admin');

const verifyToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.doc(`users/${decodedToken.uid}`).get();

    if (!userDoc.exists) {
      return res.status(401).json({ message: 'User not found' });
    }

    const userData = userDoc.data();
    
    if (!userData.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    req.user = { uid: decodedToken.uid, ...userData };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const selfOrAdmin = (req, res, next) => {
  const targetUid = req.params.uid;
  if (req.user?.uid !== targetUid && req.user?.role?.toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const writeAuditLog = async (action, user, details) => {
  try {
    await adminDb.collection('auditLogs').add({
      action,
      performedByUid: user.uid,
      performedByName: user.name || user.email,
      targetId: details.targetId || null,
      targetTitle: details.targetTitle || null,
      details: details.description || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

module.exports = { verifyToken, adminOnly, selfOrAdmin, writeAuditLog };