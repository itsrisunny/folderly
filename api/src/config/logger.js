const pino = require('pino');
const env = require('./env');

module.exports = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.newPassword',
      '*.currentPassword',
    ],
    censor: '[REDACTED]',
  },
});
