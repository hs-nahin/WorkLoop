const PERMISSION_ROLES = {
  TASK_CREATE: ['ADMIN'],
  TASK_EDIT: ['ADMIN'],
  TASK_DELETE: ['ADMIN'],
  TASK_ASSIGN_OFFICER: ['ADMIN'],
  TASK_ASSIGN_ASSISTANT: ['ADMIN'],
  TASK_ACCEPT: ['IT OFFICER', 'IT_OFFICER', 'USER'],
  TASK_SUBMIT: ['IT OFFICER', 'IT_OFFICER', 'USER'],
  TASK_MARK_INCOMPLETE: ['IT OFFICER', 'IT_OFFICER', 'USER'],
  TASK_APPROVE: ['ADMIN'],
  TASK_REJECT: ['ADMIN'],
  TASK_VIEW_ALL: ['ADMIN'],
  TASK_ADD_PROGRESS: ['IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],

  SUBTASK_CREATE: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'USER'],
  SUBTASK_EDIT: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'USER'],
  SUBTASK_DELETE: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'USER'],
  SUBTASK_UPDATE_STATUS: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],
  SUBTASK_ACCEPT: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],
  SUBTASK_REJECT: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],

  ATTACHMENT_UPLOAD: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],
  ATTACHMENT_DELETE: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],

  COMMENT_CREATE: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],

  USER_LIST: ['ADMIN'],
  USER_CREATE: ['ADMIN'],
  USER_EDIT: ['ADMIN'],
  USER_DELETE: ['ADMIN'],
  USER_TOGGLE: ['ADMIN'],
  USER_PASSWORD_RESET: ['ADMIN'],

  AUDIT_LOG_VIEW: ['ADMIN'],
  PERFORMANCE_VIEW: ['ADMIN'],
  COMPANY_SETTINGS: ['ADMIN'],
  DASHBOARD_ADMIN: ['ADMIN'],
  NOTIFICATIONS_ADMIN_VIEW: ['ADMIN'],
  NOTIFICATIONS_OFFICER_VIEW: ['IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],

  SETTINGS_VIEW: ['ADMIN'],
  PROFILE_VIEW: ['ADMIN', 'IT OFFICER', 'IT_OFFICER', 'ASSISTANT', 'USER'],
};

const normalizeRole = (role) => {
  if (!role) return '';
  const r = role.toUpperCase();
  if (r === 'IT_OFFICER') return 'IT OFFICER';
  return r;
};

const checkPermission = (permissionName) => {
  return (req, res, next) => {
    const allowedRoles = PERMISSION_ROLES[permissionName];
    if (!allowedRoles) {
      return res.status(500).json({ message: `Permission ${permissionName} not defined` });
    }
    const userRole = normalizeRole(req.user?.role);
    if (!userRole || !allowedRoles.map(r => normalizeRole(r)).includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

const hasRole = (userRole, permissionName) => {
  const allowedRoles = PERMISSION_ROLES[permissionName];
  if (!allowedRoles) return false;
  return allowedRoles.map(r => normalizeRole(r)).includes(normalizeRole(userRole));
};

module.exports = { PERMISSION_ROLES, checkPermission, hasRole };
