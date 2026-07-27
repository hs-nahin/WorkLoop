const { adminDb } = require('../firebase-admin');

const DEFAULT_ROLE_PERMISSIONS = {
  PROFILE_VIEW: true,
  COMMENT_CREATE: true,
  TASK_ADD_PROGRESS: true,
  SUBTASK_UPDATE_STATUS: true,
  ATTACHMENT_UPLOAD: true,
};

let rolePermissionsCache = {};
let userPermissionsCache = {};
let lastCacheRefresh = 0;
let lastUserCacheRefresh = 0;
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

const refreshUserCache = async (uid) => {
  try {
    const doc = await adminDb.doc(`userPermissions/${uid}`).get();
    if (doc.exists) {
      userPermissionsCache[uid] = doc.data();
    } else {
      userPermissionsCache[uid] = {};
    }
    lastUserCacheRefresh = Date.now();
  } catch (error) {
    console.error('Failed to refresh user permissions cache:', error);
  }
};

const getRolePermissions = async (roleId) => {
  if (Date.now() - lastCacheRefresh > CACHE_TTL_MS) {
    await refreshCache();
  }
  return { ...DEFAULT_ROLE_PERMISSIONS, ...(rolePermissionsCache[roleId] || {}) };
};

const getUserPermissions = async (uid) => {
  if (!uid) return {};
  if (Date.now() - lastUserCacheRefresh > CACHE_TTL_MS) {
    await refreshUserCache(uid);
  }
  return userPermissionsCache[uid] || {};
};

const checkPermission = (permissionName) => {
  return (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    if (!userRole) {
      return res.status(403).json({ message: 'No role assigned' });
    }
    if (userRole === 'ADMIN') return next();

    const uid = req.user?.uid;

    Promise.all([
      getRolePermissions(userRole),
      uid ? getUserPermissions(uid) : Promise.resolve({}),
    ])
      .then(([rolePerms, userOverrides]) => {
        if (userOverrides[permissionName] !== undefined) {
          if (userOverrides[permissionName] === true) return next();
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        if (rolePerms[permissionName] === true) return next();
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

// Synchronous check using caches (must call refreshCache/refreshUserCache first)
const hasPermission = (role, permissionName, uid) => {
  const r = (role || '').toUpperCase();
  if (r === 'ADMIN') return true;

  // Check user overrides first
  if (uid && userPermissionsCache[uid]) {
    const userOverride = userPermissionsCache[uid][permissionName];
    if (userOverride !== undefined) return userOverride === true;
  }

  // Check role permissions (includes defaults)
  const rolePerms = { ...DEFAULT_ROLE_PERMISSIONS, ...(rolePermissionsCache[r] || {}) };
  return rolePerms[permissionName] === true;
};

module.exports = { checkPermission, hasRole, hasPermission, refreshCache, refreshUserCache, DEFAULT_ROLE_PERMISSIONS };
