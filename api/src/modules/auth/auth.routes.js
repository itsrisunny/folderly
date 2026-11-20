const router = require('express').Router();
const ctrl = require('./auth.controller');
const v = require('./auth.validation');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');
const { loginLimiter, refreshLimiter } = require('../../middlewares/rateLimiters');

// No public registration: only admins create users (see /users)
router.post('/login', loginLimiter, validate({ body: v.loginBody }), ctrl.login);
router.post('/refresh', refreshLimiter, ctrl.refresh);
router.post('/logout', ctrl.logout);

router.use(authenticate);
router.get('/me', ctrl.me);
router.post('/logout-all', ctrl.logoutAll);
router.post('/change-password', validate({ body: v.changePasswordBody }), ctrl.changePassword);

module.exports = router;
