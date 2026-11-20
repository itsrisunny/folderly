const router = require('express').Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/user.routes'));
router.use('/uploads', require('../modules/uploads/upload.routes'));
router.use('/reports', require('../modules/reports/report.routes'));

module.exports = router;
