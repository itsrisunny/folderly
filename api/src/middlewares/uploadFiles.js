const multer = require('multer');
const path = require('path');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ALLOWED_TYPES } = require('../constants/upload');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_REQUEST,
    fields: 5,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_TYPES[file.mimetype];
    if (!allowedExts || !allowedExts.includes(ext)) {
      return cb(new ApiError(415, `File type not allowed: ${file.originalname}`));
    }
    cb(null, true);
  },
});

module.exports = upload.array('files', env.MAX_FILES_PER_REQUEST);
