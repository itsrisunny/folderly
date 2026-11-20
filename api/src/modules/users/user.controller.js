const asyncHandler = require('../../utils/asyncHandler');
const service = require('./user.service');

exports.create = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.user, req.body);
  res.status(201).json({ success: true, data: user });
});

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listUsers(req.query);
  res.json({ success: true, data: items, meta });
});

exports.get = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getUser(req.params.id) });
});

exports.update = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.updateUser(req.user, req.params.id, req.body) });
});

exports.remove = asyncHandler(async (req, res) => {
  await service.deactivateUser(req.user, req.params.id);
  res.json({ success: true, message: 'User deactivated' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.params.id, req.body.newPassword);
  res.json({ success: true, message: 'Password reset; all sessions revoked' });
});
