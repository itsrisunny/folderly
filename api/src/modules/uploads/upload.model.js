const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    bucket: { type: String, required: true },
    key: { type: String, required: true, unique: true }, // ROLE/USERNAME/YYYY-MM-DD/uuid-name
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    folderDate: { type: String, required: true }, // YYYY-MM-DD (business timezone)
    etag: String,
  },
  { timestamps: true }
);

uploadSchema.index({ user: 1, folderDate: -1 });
uploadSchema.index({ folderDate: -1, role: 1 });
uploadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Upload', uploadSchema);
