import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

export const ROLES = {
  ADMIN: 'ADMIN',
  IT_OFFICER: 'IT OFFICER',
  IT_OFFICER_UNDERSCORE: 'IT_OFFICER',
  ASSISTANT: 'ASSISTANT',
};

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
];

const DEFAULT_PERMISSIONS = {
  ADMIN: {
    TASK_CREATE: true, TASK_EDIT: true, TASK_DELETE: true,
    TASK_ASSIGN_OFFICER: true, TASK_ASSIGN_ASSISTANT: true,
    TASK_ACCEPT: false, TASK_SUBMIT: false, TASK_MARK_INCOMPLETE: false,
    TASK_APPROVE: true, TASK_REJECT: true, TASK_VIEW_ALL: true, TASK_ADD_PROGRESS: false,
    SUBTASK_CREATE: true, SUBTASK_EDIT: true, SUBTASK_DELETE: true, SUBTASK_UPDATE_STATUS: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: true, USER_CREATE: true, USER_EDIT: true, USER_DELETE: true, USER_TOGGLE: true, USER_PASSWORD_RESET: true,
    AUDIT_LOG_VIEW: true, PERFORMANCE_VIEW: true, COMPANY_SETTINGS: true, DASHBOARD_ADMIN: true,
  },
  'IT OFFICER': {
    TASK_CREATE: false, TASK_EDIT: false, TASK_DELETE: false,
    TASK_ASSIGN_OFFICER: false, TASK_ASSIGN_ASSISTANT: false,
    TASK_ACCEPT: true, TASK_SUBMIT: true, TASK_MARK_INCOMPLETE: true,
    TASK_APPROVE: false, TASK_REJECT: false, TASK_VIEW_ALL: false, TASK_ADD_PROGRESS: true,
    SUBTASK_CREATE: true, SUBTASK_EDIT: true, SUBTASK_DELETE: true, SUBTASK_UPDATE_STATUS: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: false, USER_CREATE: false, USER_EDIT: false, USER_DELETE: false, USER_TOGGLE: false, USER_PASSWORD_RESET: false,
    AUDIT_LOG_VIEW: false, PERFORMANCE_VIEW: false, COMPANY_SETTINGS: false, DASHBOARD_ADMIN: false,
  },
  ASSISTANT: {
    TASK_CREATE: false, TASK_EDIT: false, TASK_DELETE: false,
    TASK_ASSIGN_OFFICER: false, TASK_ASSIGN_ASSISTANT: false,
    TASK_ACCEPT: false, TASK_SUBMIT: false, TASK_MARK_INCOMPLETE: false,
    TASK_APPROVE: false, TASK_REJECT: false, TASK_VIEW_ALL: false, TASK_ADD_PROGRESS: false,
    SUBTASK_CREATE: false, SUBTASK_EDIT: false, SUBTASK_DELETE: false, SUBTASK_UPDATE_STATUS: true,
    ATTACHMENT_UPLOAD: true, ATTACHMENT_DELETE: true,
    COMMENT_CREATE: true,
    USER_LIST: false, USER_CREATE: false, USER_EDIT: false, USER_DELETE: false, USER_TOGGLE: false, USER_PASSWORD_RESET: false,
    AUDIT_LOG_VIEW: false, PERFORMANCE_VIEW: false, COMPANY_SETTINGS: false, DASHBOARD_ADMIN: false,
  },
};

const roleKey = (role) => {
  const r = (role || '').toUpperCase();
  if (r === 'IT_OFFICER') return 'IT OFFICER';
  return r;
};

let cachedPermissions = null;

export const loadPermissions = async () => {
  try {
    const results = {};
    const roleNames = ['ADMIN', 'IT OFFICER', 'ASSISTANT'];
    for (const role of roleNames) {
      const docRef = doc(db, 'rolePermissions', role);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const stored = snap.data();
        const defaults = DEFAULT_PERMISSIONS[role] || {};
        results[role] = { ...defaults, ...stored };
      } else {
        results[role] = { ...(DEFAULT_PERMISSIONS[role] || {}) };
      }
    }
    cachedPermissions = results;
    return results;
  } catch (error) {
    console.error('Failed to load permissions from Firestore, using defaults:', error);
    return DEFAULT_PERMISSIONS;
  }
};

export const savePermissions = async (role, permissions) => {
  try {
    const docRef = doc(db, 'rolePermissions', role);
    await setDoc(docRef, permissions);
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
  return cachedPermissions || DEFAULT_PERMISSIONS;
};

export const hasPermission = (role, permission) => {
  const perms = cachedPermissions || DEFAULT_PERMISSIONS;
  const key = roleKey(role);
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
