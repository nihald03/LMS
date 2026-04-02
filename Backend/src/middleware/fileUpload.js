const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const uploadDir = path.join(__dirname, '../../public/uploads/lectures');
const tempDir = path.join(__dirname, '../../public/uploads/temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in temp directory first
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${timestamp}-${randomString}${ext}`;
    cb(null, filename);
  }
});

// File filter - only allow MP4 and WebM videos
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const allowedExtensions = ['.mp4', '.webm', '.mov'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  // Check both MIME type and extension
  if (allowedMimes.includes(mime) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only MP4, WebM, and MOV videos are allowed. Received: ${mime}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  }
});

// Middleware to validate file upload
const validateVideoUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided. Please upload a video file.'
    });
  }

  // Additional validation
  if (req.file.size === 0) {
    return res.status(400).json({
      success: false,
      message: 'File is empty. Please upload a valid video file.'
    });
  }

  next();
};

// Middleware to handle file upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: 'File is too large. Maximum file size is 500MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Please upload one file at a time.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File validation error'
    });
  }

  next();
};

module.exports = {
  upload: upload.single('video'),
  validateVideoUpload,
  handleUploadError,
  uploadDir,
  tempDir
};
