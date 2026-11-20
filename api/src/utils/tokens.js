const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

// sid = session (refresh-token family) id; lets us kill access tokens on logout
const signAccessToken = (user, sessionId) =>
  jwt.sign({ role: user.role, sid: sessionId }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithm: 'HS256',
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

// Refresh tokens are opaque random strings; only their SHA-256 hash is stored.
const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken };
