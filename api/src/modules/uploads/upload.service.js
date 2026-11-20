const path = require('path');
const crypto = require('crypto');
const { fromBuffer } = require('file-type');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = require('../../config/s3');
const env = require('../../config/env');
const logger = require('../../config/logger');
const UploadModel = require('./upload.model');
const ApiError = require('../../utils/ApiError');
const { todayInTz } = require('../../utils/date');
const { TEXT_TYPES } = require('../../constants/upload');
const { PERMISSIONS, hasPermission } = require('../../constants/roles');

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9_-]/g, '');

const safeFileName = (name) => {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return base.slice(-100) || 'file';
};

// Verify real content matches declared type (magic bytes), not just the client-sent header
async function verifyContent(file) {
  const detected = await fromBuffer(file.buffer);
  if (TEXT_TYPES.has(file.mimetype)) {
    if (detected || file.buffer.includes(0)) {
      throw new ApiError(415, `File content is not valid text: ${file.originalname}`);
    }
    return;
  }
  if (!detected || detected.mime !== file.mimetype) {
    throw new ApiError(415, `File content does not match its type: ${file.originalname}`);
  }
}

async function removeFromS3(bucket, key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    logger.error({ err, key }, 'Failed to clean up S3 object');
  }
}

// Key layout:  ROLE/USERNAME/YYYY-MM-DD/uuid-filename   (inside the bucket)
async function uploadFiles(user, files) {
  for (const f of files) await verifyContent(f); // fail whole request before uploading anything

  const folderDate = todayInTz();
  const prefix = `${slug(user.role)}/${slug(user.username)}/${folderDate}`;
  const saved = [];

  try {
    for (const file of files) {
      const key = `${prefix}/${crypto.randomUUID()}-${safeFileName(file.originalname)}`;
      const result = await new Upload({
        client: s3,
        params: {
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ServerSideEncryption: 'AES256',
          Metadata: { uploadedby: slug(user.username) },
        },
      }).done();

      try {
        const doc = await UploadModel.create({
          user: user._id,
          username: user.username,
          role: user.role,
          bucket: env.AWS_S3_BUCKET,
          key,
          originalName: path.basename(file.originalname).slice(0, 255),
          mimeType: file.mimetype,
          size: file.size,
          folderDate,
          etag: result.ETag,
        });
        saved.push(doc);
      } catch (dbErr) {
        await removeFromS3(env.AWS_S3_BUCKET, key); // no orphan objects
        throw dbErr;
      }
    }
  } catch (err) {
    // roll back earlier files of this request so the request is all-or-nothing
    await Promise.all(saved.map((d) => removeFromS3(d.bucket, d.key)));
    await UploadModel.deleteMany({ _id: { $in: saved.map((d) => d._id) } });
    throw err;
  }
  return saved;
}

async function list({ userId, role, from, to, page, limit }) {
  const filter = {};
  if (userId) filter.user = userId;
  if (role) filter.role = role;
  if (from || to) {
    filter.folderDate = {};
    if (from) filter.folderDate.$gte = from;
    if (to) filter.folderDate.$lte = to;
  }
  const [items, total] = await Promise.all([
    UploadModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    UploadModel.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
}

// Short-lived presigned URL; bucket stays private
async function getDownloadUrl(user, id) {
  const doc = await UploadModel.findById(id);
  const isOwner = doc && String(doc.user) === String(user._id);
  const canReadAll = hasPermission(user.role, PERMISSIONS.UPLOAD_READ_ALL);
  if (!doc || (!isOwner && !canReadAll)) throw new ApiError(404, 'File not found'); // no enumeration

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: doc.bucket,
      Key: doc.key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
    }),
    { expiresIn: env.SIGNED_URL_TTL_SECONDS }
  );
  return { url, expiresIn: env.SIGNED_URL_TTL_SECONDS };
}

module.exports = { uploadFiles, list, getDownloadUrl };
