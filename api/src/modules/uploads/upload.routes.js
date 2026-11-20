const router = require('express').Router();
const ctrl = require('./upload.controller');
const v = require('./upload.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const uploadFiles = require('../../middlewares/uploadFiles');
const { uploadLimiter } = require('../../middlewares/rateLimiters');
const { PERMISSIONS: P } = require('../../constants/roles');
const { idParam } = require('../../utils/zodHelpers');

router.use(authenticate);

router.post('/', uploadLimiter, authorize(P.UPLOAD_CREATE), uploadFiles, ctrl.create);
router.get('/me', authorize(P.UPLOAD_READ_OWN), validate({ query: v.listMyQuery }), ctrl.listMine);
router.get('/', authorize(P.UPLOAD_READ_ALL), validate({ query: v.listAllQuery }), ctrl.listAll);
router.get('/:id/download', authorize(P.UPLOAD_READ_OWN), validate({ params: idParam }), ctrl.download);

module.exports = router;
