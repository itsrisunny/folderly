const User = require('./user.model');
const Session = require('../auth/session.model');
const ApiError = require('../../utils/ApiError');
const { hashPassword } = require('../../utils/password');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const revokeAllSessions = (userId) =>
  Session.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date() } });

async function createUser(actor, data) {
  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    name: data.name,
    username: data.username,
    email: data.email,
    role: data.role,
    passwordHash,
    passwordChangedAt: new Date(),
    createdBy: actor._id,
  });
  return user;
}

async function listUsers({ page, limit, role, isActive, search }) {
  const filter = {};
  if (role) filter.role = role;
  if (isActive) filter.isActive = isActive === 'true';
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ username: rx }, { name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function getUser(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

async function updateUser(actor, id, changes) {
  const isSelf = String(actor._id) === String(id);
  if (isSelf && (changes.role !== undefined || changes.isActive === false)) {
    throw new ApiError(400, 'You cannot change your own role or deactivate yourself');
  }
  const user = await User.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  if (changes.role !== undefined || changes.isActive === false) await revokeAllSessions(id);
  return user;
}

async function deactivateUser(actor, id) {
  return updateUser(actor, id, { isActive: false });
}

async function resetPassword(id, newPassword) {
  const passwordHash = await hashPassword(newPassword);
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { passwordHash, passwordChangedAt: new Date(), failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } },
    { new: true }
  );
  if (!user) throw new ApiError(404, 'User not found');
  await revokeAllSessions(id);
  return user;
}

module.exports = { createUser, listUsers, getUser, updateUser, deactivateUser, resetPassword };
