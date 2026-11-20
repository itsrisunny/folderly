const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../constants/roles');

// authorize(PERMISSIONS.USER_CREATE, ...)  -> user must have ALL listed permissions
const authorize = (...permissions) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  const ok = permissions.every((p) => hasPermission(req.user.role, p));
  return ok ? next() : next(new ApiError(403, 'You do not have permission to perform this action'));
};

module.exports = authorize;
