const env = require('../../config/env');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./auth.service');

const COOKIE = 'refresh_token';
const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  path: '/api/v1/auth',
};

const setCookie = (res, token) =>
  res.cookie(COOKIE, token, { ...cookieOpts, maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000 });
const clearCookie = (res) => res.clearCookie(COOKIE, cookieOpts);
const meta = (req) => ({ ip: req.ip, userAgent: req.get('user-agent') });

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await service.login(req.body, meta(req));
  setCookie(res, refreshToken);
  res.json({ success: true, data: { user, accessToken, expiresIn: env.JWT_ACCESS_EXPIRES } });
});

exports.refresh = asyncHandler(async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await service.refresh(req.cookies[COOKIE], meta(req));
    setCookie(res, refreshToken);
    res.json({ success: true, data: { user, accessToken, expiresIn: env.JWT_ACCESS_EXPIRES } });
  } catch (err) {
    clearCookie(res);
    throw err;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  const [scheme, bearer] = (req.headers.authorization || '').split(' ');
  await service.logout({
    refreshToken: req.cookies[COOKIE],
    accessToken: scheme === 'Bearer' ? bearer : undefined,
  });
  clearCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

exports.logoutAll = asyncHandler(async (req, res) => {
  await service.logoutAll(req.user._id);
  clearCookie(res);
  res.json({ success: true, message: 'Logged out from all devices' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user._id, req.body);
  clearCookie(res);
  res.json({ success: true, message: 'Password changed. Please login again' });
});

exports.me = (req, res) => res.json({ success: true, data: req.user });
