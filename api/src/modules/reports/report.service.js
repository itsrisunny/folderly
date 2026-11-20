const mongoose = require('mongoose');
const Upload = require('../uploads/upload.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');

const oid = (id) => new mongoose.Types.ObjectId(String(id));
const group = (id) => ({ $group: { _id: id, files: { $sum: 1 }, bytes: { $sum: '$size' } } });
const rename = (field) => ({ $project: { _id: 0, [field]: '$_id', files: 1, bytes: 1 } });
const rangeMatch = (from, to) => ({ folderDate: { $gte: from, $lte: to } });

// A single user's dashboard (used for "my report" and admin drill-down)
async function userReport(userId, { from, to }) {
  const [r] = await Upload.aggregate([
    { $match: { user: oid(userId), ...rangeMatch(from, to) } },
    {
      $facet: {
        totals: [group(null)],
        byDay: [group('$folderDate'), { $sort: { _id: 1 } }, rename('date')],
        byType: [group('$mimeType'), { $sort: { files: -1 } }, rename('mimeType')],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          { $project: { _id: 0, id: '$_id', originalName: 1, mimeType: 1, size: 1, folderDate: 1, createdAt: 1 } },
        ],
      },
    },
  ]);
  const t = r.totals[0] || { files: 0, bytes: 0 };
  return {
    range: { from, to },
    totals: { files: t.files, bytes: t.bytes },
    byDay: r.byDay,
    byType: r.byType,
    recent: r.recent,
  };
}

async function adminUserReport(userId, range) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return { user, report: await userReport(userId, range) };
}

// Admin overview dashboard
async function dashboard({ from, to }) {
  const [uploadFacets, userTotals, usersByRole] = await Promise.all([
    Upload.aggregate([
      { $match: rangeMatch(from, to) },
      {
        $facet: {
          totals: [group(null)],
          byRole: [group('$role'), { $sort: { files: -1 } }, rename('role')],
          byDay: [group('$folderDate'), { $sort: { _id: 1 } }, rename('date')],
          byType: [group('$mimeType'), { $sort: { files: -1 } }, rename('mimeType')],
          topUsers: [
            { $group: { _id: '$user', username: { $first: '$username' }, role: { $first: '$role' }, files: { $sum: 1 }, bytes: { $sum: '$size' } } },
            { $sort: { files: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, userId: '$_id', username: 1, role: 1, files: 1, bytes: 1 } },
          ],
          activeUsers: [{ $group: { _id: '$user' } }, { $count: 'count' }],
        },
      },
    ]),
    User.aggregate([
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]),
    User.aggregate([{ $group: { _id: '$role', users: { $sum: 1 } } }, { $project: { _id: 0, role: '$_id', users: 1 } }]),
  ]);

  const f = uploadFacets[0];
  const t = f.totals[0] || { files: 0, bytes: 0 };
  const u = userTotals[0] || { total: 0, active: 0 };
  return {
    range: { from, to },
    users: { total: u.total, active: u.active, byRole: usersByRole },
    uploads: {
      files: t.files,
      bytes: t.bytes,
      usersWhoUploaded: f.activeUsers[0]?.count || 0,
      byRole: f.byRole,
      byDay: f.byDay,
      byType: f.byType,
      topUsers: f.topUsers,
    },
  };
}

// Per-user table (includes users with 0 uploads)
async function usersSummary({ from, to, page, limit, role, isActive }) {
  const match = {};
  if (role) match.role = role;
  if (isActive) match.isActive = isActive === 'true';

  const [items, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      {
        $lookup: {
          from: Upload.collection.name,
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user', '$$uid'] }, ...rangeMatch(from, to) } },
            { $group: { _id: null, files: { $sum: 1 }, bytes: { $sum: '$size' }, lastUploadAt: { $max: '$createdAt' } } },
          ],
          as: 'stats',
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: 1,
          name: 1,
          role: 1,
          isActive: 1,
          files: { $ifNull: [{ $arrayElemAt: ['$stats.files', 0] }, 0] },
          bytes: { $ifNull: [{ $arrayElemAt: ['$stats.bytes', 0] }, 0] },
          lastUploadAt: { $arrayElemAt: ['$stats.lastUploadAt', 0] },
        },
      },
      { $sort: { files: -1, username: 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
    User.countDocuments(match),
  ]);

  return { range: { from, to }, items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

module.exports = { userReport, adminUserReport, dashboard, usersSummary };
