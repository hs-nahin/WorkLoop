const { adminDb } = require('../firebase-admin');

let rolePermissionsCache = {};
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 60000;

const refreshCache = async () => {
  try {
    const snapshot = await adminDb.collection('rolePermissions').get();
    const cache = {};
    snapshot.docs.forEach(doc => {
      cache[doc.id] = doc.data();
    });
    rolePermissionsCache = cache;
    lastCacheRefresh = Date.now();
  } catch (error) {
    console.error('Failed to refresh permissions cache:', error);
  }
};

const getRolePermissions = async (roleId) => {
  if (Date.now() - lastCacheRefresh > CACHE_TTL_MS) {
    await refreshCache();
  }
  return rolePermissionsCache[roleId] || {};
};

const checkPermission = (permissionName) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    if (!userRole) {
      return res.status(403).json({ message: 'No role assigned' });
    }
    if (userRole === 'ADMIN') return next();

    getRolePermissions(userRole)
      .then(perms => {
        if (perms[permissionName] === true) return next();
        return res.status(403).json({ message: 'Insufficient permissions' });
      })
      .catch(() => {
        return res.status(500).json({ message: 'Failed to check permissions' });
      });
  };
};

const hasRole = async (userRole, permissionName) => {
  const r = (userRole || '').toUpperCase();
  if (r === 'ADMIN') return true;
  const perms = await getRolePermissions(r);
  return perms[permissionName] === true;
};

module.exports = { checkPermission, hasRole, refreshCache };
