const mongoose = require('mongoose');

// One document per issued refresh token (rotated on every refresh)
const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true }, // all rotations of one login
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Mongo auto-deletes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
