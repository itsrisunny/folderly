const router = require('express').Router();
const ctrl = require('./report.controller');
const v = require('./report.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { PERMISSIONS: P } = require('../../constants/roles');
const { idParam } = require('../../utils/zodHelpers');

router.use(authenticate);

router.get('/me', authorize(P.REPORT_READ_OWN), validate({ query: v.rangeQuery }), ctrl.myReport);

// Admin only
router.get('/dashboard', authorize(P.REPORT_READ_ALL), validate({ query: v.rangeQuery }), ctrl.dashboard);
router.get('/users', authorize(P.REPORT_READ_ALL), validate({ query: v.usersSummaryQuery }), ctrl.usersSummary);
router.get('/users/:id', authorize(P.REPORT_READ_ALL), validate({ params: idParam, query: v.rangeQuery }), ctrl.userReport);

module.exports = router;
