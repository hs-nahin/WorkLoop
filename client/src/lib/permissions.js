import { apiRequest } from '@/api/apiClient';
import { db } from '@/firebase/firebaseConfig';
import { collection, onSnapshot, doc } from 'firebase/firestore';

export const ALL_PERMISSIONS = [
  { id: 'TASK_CREATE', label: 'Create Task', group: 'Task Management' },
  { id: 'TASK_EDIT', label: 'Edit Task', group: 'Task Management' },
  { id: 'TASK_DELETE', label: 'Delete Task', group: 'Task Management' },
  { id: 'TASK_ASSIGN_OFFICER', label: 'Assign Officer', group: 'Task Management' },
  { id: 'TASK_ASSIGN_ASSISTANT', label: 'Assign Assistant', group: 'Task Management' },
  { id: 'TASK_ACCEPT', label: 'Accept Task', group: 'Task Management' },
  { id: 'TASK_SUBMIT', label: 'Submit Task', group: 'Task Management' },
  { id: 'TASK_MARK_INCOMPLETE', label: 'Mark Task Incomplete', group: 'Task Management' },
  { id: 'TASK_APPROVE', label: 'Approve Task', group: 'Task Management' },
  { id: 'TASK_REJECT', label: 'Reject Task', group: 'Task Management' },
  { id: 'TASK_VIEW_ALL', label: 'View All Tasks', group: 'Task Management' },
  { id: 'TASK_ADD_PROGRESS', label: 'Add Progress Report', group: 'Task Management' },
  { id: 'SUBTASK_CREATE', label: 'Create Subtask', group: 'Subtask Management' },
  { id: 'SUBTASK_EDIT', label: 'Edit Subtask', group: 'Subtask Management' },
  { id: 'SUBTASK_DELETE', label: 'Delete Subtask', group: 'Subtask Management' },
  { id: 'SUBTASK_UPDATE_STATUS', label: 'Update Subtask Status', group: 'Subtask Management' },
  { id: 'SUBTASK_ACCEPT', label: 'Accept Subtask', group: 'Subtask Management' },
  { id: 'SUBTASK_REJECT', label: 'Reject Subtask', group: 'Subtask Management' },
  { id: 'ATTACHMENT_UPLOAD', label: 'Upload Attachments', group: 'Attachments' },
  { id: 'ATTACHMENT_DELETE', label: 'Delete Attachments', group: 'Attachments' },
  { id: 'COMMENT_CREATE', label: 'Comment on Tasks', group: 'Discussion' },
  { id: 'USER_LIST', label: 'List Users', group: 'User Management' },
  { id: 'USER_CREATE', label: 'Create Users', group: 'User Management' },
  { id: 'USER_EDIT', label: 'Edit Users', group: 'User Management' },
  { id: 'USER_DELETE', label: 'Delete Users', group: 'User Management' },
  { id: 'USER_TOGGLE', label: 'Activate/Deactivate Users', group: 'User Management' },
  { id: 'USER_PASSWORD_RESET', label: 'Reset User Passwords', group: 'User Management' },
  { id: 'AUDIT_LOG_VIEW', label: 'View Audit Logs', group: 'System' },
  { id: 'PERFORMANCE_VIEW', label: 'View Performance Reports', group: 'System' },
  { id: 'COMPANY_SETTINGS', label: 'Manage Company Settings', group: 'System' },
  { id: 'DASHBOARD_ADMIN', label: 'Admin Dashboard Access', group: 'System' },
  { id: 'PROFILE_VIEW', label: 'View Profile', group: 'System' },
  { id: 'ANNOUNCEMENT_VIEW', label: 'Access Announcements Page', group: 'Announcements' },
  { id: 'ANNOUNCEMENT_HISTORY_VIEW', label: 'Access Announcement History', group: 'Announcements' },
  { id: 'ANNOUNCEMENT_CREATE', label: 'Create Announcements', group: 'Announcements' },
  { id: 'ANNOUNCEMENT_EDIT', label: 'Edit Announcements', group: 'Announcements' },
  { id: 'ANNOUNCEMENT_DELETE', label: 'Delete Announcements', group: 'Announcements' },
];

export const ADMIN_FULL_PERMISSIONS = ALL_PERMISSIONS.reduce((acc, p) => {
  acc[p.id] = true;
  return acc;
}, {});

export const DEFAULT_ROLE_PERMISSIONS = {
  PROFILE_VIEW: true,
  COMMENT_CREATE: true,
  TASK_ADD_PROGRESS: true,
  SUBTASK_UPDATE_STATUS: true,
  ATTACHMENT_UPLOAD: true,
};

const roleKey = (role) => (role || '').toUpperCase();

let cachedPermissions = { ADMIN: { ...ADMIN_FULL_PERMISSIONS } };
let cachedRoles = [];
let cachedUserPermissions = {};
let changeListeners = [];
let permissionsVersion = 0;
let unsubRolePerms = null;
let unsubUserPerms = null;

export const onPermissionsChange = (fn) => {
  changeListeners.push(fn);
  return () => {
    changeListeners = changeListeners.filter(l => l !== fn);
  };
};

export const getPermissionsVersion = () => permissionsVersion;

const notifyChange = () => {
  permissionsVersion++;
  changeListeners.forEach(fn => fn());
};

export const getRoles = () => cachedRoles;

export const loadRoles = async () => {
  try {
    const roles = await apiRequest({ endpoint: '/roles' });
    cachedRoles = Array.isArray(roles) ? roles : [];
    return cachedRoles;
  } catch (error) {
    console.error('Failed to load roles:', error);
    return [];
  }
};

export const loadPermissions = async () => {
  try {
    const results = { ADMIN: { ...ADMIN_FULL_PERMISSIONS } };

    const roles = await apiRequest({ endpoint: '/roles' });
    const rolesList = Array.isArray(roles) ? roles : [];

    for (const role of rolesList) {
      results[role.id] = { ...DEFAULT_ROLE_PERMISSIONS, ...(role.defaultPermissions || {}) };
    }

    cachedPermissions = results;
    cachedRoles = rolesList;
    return results;
  } catch (error) {
    console.error('Failed to load permissions from server, using defaults:', error);
    cachedPermissions = { ADMIN: { ...ADMIN_FULL_PERMISSIONS } };
    return cachedPermissions;
  }
};

export const savePermissions = async (role, permissions) => {
  try {
    await apiRequest({
      endpoint: `/roles/${role}/permissions`,
      method: 'PUT',
      body: { permissions },
    });
    if (cachedPermissions) {
      cachedPermissions[role] = permissions;
    }
    notifyChange();
    return true;
  } catch (error) {
    console.error('Failed to save permissions:', error);
    return false;
  }
};

export const getPermissions = () => cachedPermissions;

export const saveUserPermissions = async (uid, permissions) => {
  try {
    await apiRequest({
      endpoint: `/roles/users/${uid}/permissions`,
      method: 'PUT',
      body: { permissions },
    });
    cachedUserPermissions[uid] = permissions;
    notifyChange();
    return true;
  } catch (error) {
    console.error('Failed to save user permissions:', error);
    return false;
  }
};

export const loadUserPermissions = async (uid) => {
  try {
    const result = await apiRequest({ endpoint: `/roles/users/${uid}/permissions` });
    const perms = result?.permissions || {};
    cachedUserPermissions[uid] = perms;
    return perms;
  } catch (error) {
    console.error('Failed to load user permissions:', error);
    cachedUserPermissions[uid] = {};
    return {};
  }
};

export const getUserEffectivePermissions = (uid, role) => {
  const key = roleKey(role);
  if (key === 'ADMIN') return { ...ADMIN_FULL_PERMISSIONS };
  const rolePerms = (cachedPermissions || {})[key] || {};
  const userOverrides = cachedUserPermissions[uid];
  if (!userOverrides || Object.keys(userOverrides).length === 0) {
    return { ...rolePerms };
  }
  return { ...rolePerms, ...userOverrides };
};

export const hasUserPermission = (user, permission) => {
  if (!user) return false;
  const key = roleKey(user.role);
  if (key === 'ADMIN') return true;
  const uid = user.uid || user.id;
  if (uid && cachedUserPermissions[uid] && cachedUserPermissions[uid][permission] !== undefined) {
    return cachedUserPermissions[uid][permission] === true;
  }
  return hasPermission(user.role, permission);
};

export const hasPermission = (role, permission) => {
  const key = roleKey(role);
  if (key === 'ADMIN') return true;
  const perms = cachedPermissions || { ADMIN: { ...ADMIN_FULL_PERMISSIONS } };
  const rolePerms = perms[key];
  if (!rolePerms) {
    return DEFAULT_ROLE_PERMISSIONS[permission] === true;
  }
  if (Object.keys(rolePerms).length === 0) {
    return DEFAULT_ROLE_PERMISSIONS[permission] === true;
  }
  return rolePerms[permission] === true;
};

export const canAny = (role, permissions) => {
  return permissions.some(p => hasPermission(role, p));
};

export const canAll = (role, permissions) => {
  return permissions.every(p => hasPermission(role, p));
};

export const subscribeToPermissions = (uid) => {
  unsubscribeFromPermissions();

  unsubRolePerms = onSnapshot(collection(db, 'rolePermissions'), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified' || change.type === 'removed') {
        const roleId = change.doc.id;
        const data = change.doc.data();
        if (change.type === 'removed') {
          cachedPermissions[roleId] = { ...DEFAULT_ROLE_PERMISSIONS };
        } else {
          cachedPermissions[roleId] = { ...DEFAULT_ROLE_PERMISSIONS, ...data };
        }
      }
    });
    notifyChange();
  }, (error) => {
    console.error('Role permissions listener error:', error);
  });

  if (uid) {
    unsubUserPerms = onSnapshot(doc(db, 'userPermissions', uid), (docSnap) => {
      if (docSnap.exists()) {
        cachedUserPermissions[uid] = docSnap.data();
      } else {
        cachedUserPermissions[uid] = {};
      }
      notifyChange();
    }, (error) => {
      console.error('User permissions listener error:', error);
    });
  }
};

export const unsubscribeFromPermissions = () => {
  if (unsubRolePerms) {
    try { unsubRolePerms(); } catch (_) {}
    unsubRolePerms = null;
  }
  if (unsubUserPerms) {
    try { unsubUserPerms(); } catch (_) {}
    unsubUserPerms = null;
  }
};

loadPermissions();
