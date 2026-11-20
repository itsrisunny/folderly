const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const service = require('./upload.service');

const view = (d) => ({
  id: d._id,
  originalName: d.originalName,
  mimeType: d.mimeType,
  size: d.size,
  key: d.key,
  folderDate: d.folderDate,
  createdAt: d.createdAt,
});

exports.create = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files received. Send multipart/form-data with field name "files"');
  }
  const docs = await service.uploadFiles(req.user, req.files);
  res.status(201).json({ success: true, data: docs.map(view) });
});

exports.listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list({ ...req.query, userId: req.user._id });
  res.json({ success: true, data: items.map(view), meta });
});

exports.listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.query);
  res.json({ success: true, data: items.map((d) => ({ ...view(d), username: d.username, role: d.role })), meta });
});

exports.download = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await service.getDownloadUrl(req.user, req.params.id) });
});
