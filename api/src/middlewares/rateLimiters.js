const rateLimit = require('express-rate-limit');

const make = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  });

module.exports = {
  globalLimiter: make(15 * 60 * 1000, 300),
  loginLimiter: make(15 * 60 * 1000, 10),
  refreshLimiter: make(15 * 60 * 1000, 60),
  uploadLimiter: make(60 * 60 * 1000, 100),
};
