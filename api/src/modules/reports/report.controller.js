const asyncHandler = require('../../utils/asyncHandler');
const service = require('./report.service');

// Regular users: ALWAYS scoped to req.user – no id accepted from the client
exports.myReport = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.userReport(req.user._id, req.query) });
});

exports.dashboard = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.dashboard(req.query) });
});

exports.usersSummary = asyncHandler(async (req, res) => {
  const { items, meta, range } = await service.usersSummary(req.query);
  res.json({ success: true, data: { range, items }, meta });
});

exports.userReport = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.adminUserReport(req.params.id, req.query) });
});
