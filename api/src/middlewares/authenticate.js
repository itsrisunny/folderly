const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const User = require('../modules/users/user.model');
const Session = require('../modules/auth/session.model');

module.exports = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  if (!payload.sid) throw new ApiError(401, 'Invalid or expired token');

  // Always re-check the DB: logout / role change / deactivation / password change apply immediately
  const [user, activeSession] = await Promise.all([
    User.findById(payload.sub).select('+passwordChangedAt'),
    Session.exists({
      family: payload.sid,
      user: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
  ]);
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid or expired token');
  if (!activeSession) throw new ApiError(401, 'Session ended, please login again');
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new ApiError(401, 'Token no longer valid, please login again');
  }

  req.user = user;
  next();
});
