import { doc, getDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { apiRequest } from '@/api/apiClient';

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
];

export const ADMIN_FULL_PERMISSIONS = ALL_PERMISSIONS.reduce((acc, p) => {
  acc[p.id] = true;
  return acc;
}, {});

const DEFAULT_ROLE_PERMISSIONS = {
  USER: {
    TASK_CREATE: false, TASK_EDIT: false, TASK_DELETE: false,
    TASK_ASSIGN_OFFICER: false, TASK_ASSIGN_ASSISTANT: false,
    TASK_ACCEPT: true, TASK_SUBMIT: true, TASK_MARK_INCOMPLETE: true,
    TASK_APPROVE: false, TASK_REJECT: false, TASK_VIEW_ALL: false, TASK_ADD_PROGRESS: true,
    SUBTASK_CREATE: true, SUBTASK_EDIT: true, SUBTASK_DELETE: true, SUBTASK_UPDATE_STATUS: true, SUBTASK_ACCEPT: true, SUBTASK_REJECT: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: false, USER_CREATE: false, USER_EDIT: false, USER_DELETE: false, USER_TOGGLE: false, USER_PASSWORD_RESET: false,
    AUDIT_LOG_VIEW: false, PERFORMANCE_VIEW: false, COMPANY_SETTINGS: false, DASHBOARD_ADMIN: false,
    PROFILE_VIEW: true,
  },
  'IT OFFICER': {
    TASK_CREATE: false, TASK_EDIT: false, TASK_DELETE: false,
    TASK_ASSIGN_OFFICER: false, TASK_ASSIGN_ASSISTANT: false,
    TASK_ACCEPT: true, TASK_SUBMIT: true, TASK_MARK_INCOMPLETE: true,
    TASK_APPROVE: false, TASK_REJECT: false, TASK_VIEW_ALL: false, TASK_ADD_PROGRESS: true,
    SUBTASK_CREATE: true, SUBTASK_EDIT: true, SUBTASK_DELETE: true, SUBTASK_UPDATE_STATUS: true, SUBTASK_ACCEPT: true, SUBTASK_REJECT: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: false, USER_CREATE: false, USER_EDIT: false, USER_DELETE: false, USER_TOGGLE: false, USER_PASSWORD_RESET: false,
    AUDIT_LOG_VIEW: false, PERFORMANCE_VIEW: false, COMPANY_SETTINGS: false, DASHBOARD_ADMIN: false,
    PROFILE_VIEW: true,
  },
  ASSISTANT: {
    TASK_CREATE: false, TASK_EDIT: false, TASK_DELETE: false,
    TASK_ASSIGN_OFFICER: false, TASK_ASSIGN_ASSISTANT: false,
    TASK_ACCEPT: false, TASK_SUBMIT: false, TASK_MARK_INCOMPLETE: false,
    TASK_APPROVE: false, TASK_REJECT: false, TASK_VIEW_ALL: false, TASK_ADD_PROGRESS: false,
    SUBTASK_CREATE: false, SUBTASK_EDIT: false, SUBTASK_DELETE: false, SUBTASK_UPDATE_STATUS: true, SUBTASK_ACCEPT: true, SUBTASK_REJECT: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: false, USER_CREATE: false, USER_EDIT: false, USER_DELETE: false, USER_TOGGLE: false, USER_PASSWORD_RESET: false,
    AUDIT_LOG_VIEW: false, PERFORMANCE_VIEW: false, COMPANY_SETTINGS: false, DASHBOARD_ADMIN: false,
    PROFILE_VIEW: true,
  },
};

const roleKey = (role) => {
  const r = (role || '').toUpperCase();
  if (r === 'IT_OFFICER') return 'IT OFFICER';
  return r;
};

let cachedPermissions = null;
let cachedRoles = [];
let cachedUserPermissions = {};
let permissionsReady = false;
let readyListeners = [];
let changeListeners = [];
let permissionsVersion = 0;
const rolePermissionUnsubs = {};
const userPermissionUnsubs = {};
let rolesUnsub = null;

export const onPermissionsReady = (fn) => {
  if (permissionsReady) {
    fn();
  } else {
    readyListeners.push(fn);
  }
};

export const onPermissionsChange = (fn) => {
  changeListeners.push(fn);
  return () => {
    changeListeners = changeListeners.filter(l => l !== fn);
  };
};

export const getPermissionsVersion = () => permissionsVersion;

const notifyReady = () => {
  permissionsReady = true;
  readyListeners.forEach(fn => fn());
  readyListeners = [];
};

const notifyChange = () => {
  permissionsVersion++;
  changeListeners.forEach(fn => fn());
};

export const subscribeRoles = () => {
  if (rolesUnsub) return;
  try {
    rolesUnsub = onSnapshot(
      collection(db, 'roles'),
      (snap) => {
        cachedRoles = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        notifyChange();
      },
      () => {
        cachedRoles = [];
      }
    );
  } catch (err) {
    console.error('Failed to subscribe to roles:', err);
    cachedRoles = [];
  }
};

export const unsubscribeRoles = () => {
  if (rolesUnsub) {
    rolesUnsub();
    rolesUnsub = null;
  }
};

export const getRoles = () => cachedRoles;

export const loadRoles = async () => {
  try {
    const { apiRequest } = await import('@/api/apiClient');
    const roles = await apiRequest({ endpoint: '/roles' });
    cachedRoles = Array.isArray(roles) ? roles : [];
    return cachedRoles;
  } catch (error) {
    console.error('Failed to load roles:', error);
    return [];
  }
};

export const subscribeRolePermissions = (role) => {
  const key = roleKey(role);
  if (!key || rolePermissionUnsubs[key]) return;
  try {
    rolePermissionUnsubs[key] = onSnapshot(
      doc(db, 'rolePermissions', key),
      (snap) => {
        if (!cachedPermissions) return;
        if (snap.exists()) {
          const stored = snap.data();
          const defaults = DEFAULT_ROLE_PERMISSIONS[key] || {};
          cachedPermissions[key] = { ...defaults, ...stored };
        } else {
          const defaults = DEFAULT_ROLE_PERMISSIONS[key] || {};
          cachedPermissions[key] = { ...defaults };
        }
        notifyChange();
      },
      () => {}
    );
  } catch (err) {
    console.error('Failed to subscribe to role permissions:', err);
  }
};

export const unsubscribeRolePermissions = (role) => {
  const key = roleKey(role);
  if (key && rolePermissionUnsubs[key]) {
    rolePermissionUnsubs[key]();
    delete rolePermissionUnsubs[key];
  }
};

export const subscribeUserPermissions = (uid) => {
  if (!uid) return;
  if (userPermissionUnsubs[uid]) return;
  try {
    userPermissionUnsubs[uid] = onSnapshot(
      doc(db, 'userPermissions', uid),
      (snap) => {
        const data = snap.exists() ? snap.data() : {};
        cachedUserPermissions[uid] = data;
        notifyChange();
      },
      () => {
        cachedUserPermissions[uid] = {};
      }
    );
  } catch (err) {
    console.error('Failed to subscribe to user permissions:', err);
    cachedUserPermissions[uid] = {};
  }
};

export const unsubscribeUserPermissions = (uid) => {
  if (uid && userPermissionUnsubs[uid]) {
    userPermissionUnsubs[uid]();
    delete userPermissionUnsubs[uid];
  }
};

export const loadPermissions = async () => {
  try {
    const results = { ADMIN: { ...ADMIN_FULL_PERMISSIONS } };

    const { apiRequest } = await import('@/api/apiClient');
    const roles = await apiRequest({ endpoint: '/roles' });
    const rolesList = Array.isArray(roles) ? roles : [];

    for (const role of rolesList) {
      const roleId = role.id;
      const defaults = DEFAULT_ROLE_PERMISSIONS[roleId] || {};
      const stored = role.defaultPermissions || {};
      results[roleId] = { ...defaults, ...stored };
    }

    for (const roleId of Object.keys(DEFAULT_ROLE_PERMISSIONS)) {
      if (!results[roleId]) {
        results[roleId] = { ...(DEFAULT_ROLE_PERMISSIONS[roleId] || {}) };
      }
    }

    cachedPermissions = results;
    cachedRoles = rolesList;
    return results;
  } catch (error) {
    console.error('Failed to load permissions from server, using defaults:', error);
    cachedPermissions = { ADMIN: { ...ADMIN_FULL_PERMISSIONS }, ...DEFAULT_ROLE_PERMISSIONS };
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
    return true;
  } catch (error) {
    console.error('Failed to save permissions:', error);
    return false;
  }
};

export const getPermissions = () => {
  return cachedPermissions || { ADMIN: { ...ADMIN_FULL_PERMISSIONS }, ...DEFAULT_ROLE_PERMISSIONS };
};

export const saveUserPermissions = async (uid, permissions) => {
  try {
    await apiRequest({
      endpoint: `/roles/users/${uid}/permissions`,
      method: 'PUT',
      body: { permissions },
    });
    cachedUserPermissions[uid] = permissions;
    return true;
  } catch (error) {
    console.error('Failed to save user permissions:', error);
    return false;
  }
};

export const loadUserPermissions = async (uid) => {
  try {
    const docRef = doc(db, 'userPermissions', uid);
    const snap = await getDoc(docRef);
    const perms = snap.exists() ? snap.data() : {};
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
  const rolePerms = (cachedPermissions || {})[key] || DEFAULT_ROLE_PERMISSIONS[key] || {};
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
  const perms = cachedPermissions || { ADMIN: { ...ADMIN_FULL_PERMISSIONS }, ...DEFAULT_ROLE_PERMISSIONS };
  const rolePerms = perms[key];
  if (!rolePerms) return false;
  return rolePerms[permission] === true;
};

export const canAny = (role, permissions) => {
  return permissions.some(p => hasPermission(role, p));
};

export const canAll = (role, permissions) => {
  return permissions.every(p => hasPermission(role, p));
};

let permissionsPromise = null;

const ensurePermissionsLoaded = () => {
  if (!permissionsPromise) {
    permissionsPromise = loadPermissions().then(() => {
      notifyReady();
    });
  }
  return permissionsPromise;
};

ensurePermissionsLoaded();
