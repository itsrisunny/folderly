const crypto = require('crypto');
const env = require('../../config/env');
const User = require('../users/user.model');
const Session = require('./session.model');
const ApiError = require('../../utils/ApiError');
const { comparePassword, hashPassword, DUMMY_HASH } = require('../../utils/password');
const { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken } = require('../../utils/tokens');

const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
const INVALID_CREDENTIALS = () => new ApiError(401, 'Invalid credentials');

async function createSession(user, { family, ip, userAgent } = {}) {
  const raw = generateRefreshToken();
  const sessionFamily = family || crypto.randomUUID();
  await Session.create({
    user: user._id,
    tokenHash: hashToken(raw),
    family: sessionFamily,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    ip,
    userAgent: (userAgent || '').slice(0, 255),
  });
  return { raw, family: sessionFamily };
}

const revokeFamily = (family) =>
  Session.updateMany({ family, revokedAt: null }, { $set: { revokedAt: new Date() } });

async function login({ identifier, password }, meta) {
  const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select(
    '+passwordHash +failedLoginAttempts +lockUntil'
  );

  if (user && user.lockUntil && user.lockUntil > new Date()) {
    throw new ApiError(423, 'Account temporarily locked due to failed attempts. Try again later');
  }

  // Always run bcrypt (even for unknown users) to keep timing constant
  const valid = await comparePassword(password, user ? user.passwordHash : DUMMY_HASH);

  if (!user || !valid || !user.isActive) {
    if (user && !valid) {
      const updated = await User.findByIdAndUpdate(
        user._id,
        { $inc: { failedLoginAttempts: 1 } },
        { new: true }
      ).select('+failedLoginAttempts');
      if (updated.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id },
          { $set: { lockUntil: new Date(Date.now() + env.LOCK_MINUTES * 60 * 1000), failedLoginAttempts: 0 } }
        );
      }
    }
    throw INVALID_CREDENTIALS();
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } }
  );

  const { raw, family } = await createSession(user, meta);
  return { user, accessToken: signAccessToken(user, family), refreshToken: raw };
}

// Rotation + reuse detection
async function refresh(rawToken, meta) {
  if (!rawToken) throw new ApiError(401, 'Refresh token missing');
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Atomically consume the token – only one request can win
  const session = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now } }
  );

  if (!session) {
    // Token already used/revoked => possible theft. Kill the whole family.
    const reused = await Session.findOne({ tokenHash });
    if (reused) await revokeFamily(reused.family);
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(session.user);
  if (!user || !user.isActive) {
    await revokeFamily(session.family);
    throw new ApiError(401, 'Invalid refresh token');
  }

  const { raw, family } = await createSession(user, { ...meta, family: session.family });
  return { user, accessToken: signAccessToken(user, family), refreshToken: raw };
}

// Revokes the session by refresh cookie and/or by the access token's sid
async function logout({ refreshToken, accessToken }) {
  if (refreshToken) {
    const s = await Session.findOne({ tokenHash: hashToken(refreshToken) });
    if (s) await revokeFamily(s.family);
  }
  if (accessToken) {
    try {
      const { sid } = verifyAccessToken(accessToken);
      if (sid) await revokeFamily(sid);
    } catch {
      /* expired / invalid token: nothing to revoke */
    }
  }
}

const logoutAll = (userId) =>
  Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw new ApiError(400, 'Current password is incorrect');
  }
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();
  await logoutAll(userId); // force re-login everywhere
}

module.exports = { login, refresh, logout, logoutAll, changePassword };
