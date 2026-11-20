const router = require('express').Router();
const ctrl = require('./user.controller');
const v = require('./user.validation');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { PERMISSIONS: P } = require('../../constants/roles');
const { idParam } = require('../../utils/zodHelpers');

router.use(authenticate);

router.post('/', authorize(P.USER_CREATE), validate({ body: v.createUserBody }), ctrl.create);
router.get('/', authorize(P.USER_READ), validate({ query: v.listUsersQuery }), ctrl.list);
router.get('/:id', authorize(P.USER_READ), validate({ params: idParam }), ctrl.get);
router.patch('/:id', authorize(P.USER_UPDATE), validate({ params: idParam, body: v.updateUserBody }), ctrl.update);
router.delete('/:id', authorize(P.USER_DELETE), validate({ params: idParam }), ctrl.remove);
router.post(
  '/:id/reset-password',
  authorize(P.USER_UPDATE),
  validate({ params: idParam, body: v.resetPasswordBody }),
  ctrl.resetPassword
);

module.exports = router;
