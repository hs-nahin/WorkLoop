// Legacy file - auth middleware consolidated in ./auth.js
// This file re-exports from the primary auth middleware for backward compatibility
const { verifyToken, adminOnly, selfOrAdmin, authorize, writeAuditLog } = require('./auth');

const protect = verifyToken;

module.exports = { protect, authorize, verifyToken, adminOnly, selfOrAdmin, writeAuditLog };
