// Add / rename business roles here. Role names are used as S3 folder names,
// so keep them lowercase [a-z0-9_-].
const ROLES = Object.freeze({
  ADMIN: 'admin',
  MARKETING: 'marketing',
  SALES: 'sales',
  HR: 'hr',
  FINANCE: 'finance',
  SUPPORT: 'support',
});

const ROLE_LIST = Object.values(ROLES);

const PERMISSIONS = Object.freeze({
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  UPLOAD_CREATE: 'upload:create',
  UPLOAD_READ_OWN: 'upload:read:own',
  UPLOAD_READ_ALL: 'upload:read:all',
  REPORT_READ_OWN: 'report:read:own',
  REPORT_READ_ALL: 'report:read:all',
});

const STANDARD_USER_PERMISSIONS = [
  PERMISSIONS.UPLOAD_CREATE,
  PERMISSIONS.UPLOAD_READ_OWN,
  PERMISSIONS.REPORT_READ_OWN,
];

// Role -> permissions. Override any role individually if needed.
const ROLE_PERMISSIONS = Object.freeze(
  ROLE_LIST.reduce((acc, role) => {
    acc[role] = role === ROLES.ADMIN ? Object.values(PERMISSIONS) : [...STANDARD_USER_PERMISSIONS];
    return acc;
  }, {})
);

const hasPermission = (role, permission) => (ROLE_PERMISSIONS[role] || []).includes(permission);

module.exports = { ROLES, ROLE_LIST, PERMISSIONS, ROLE_PERMISSIONS, hasPermission };
