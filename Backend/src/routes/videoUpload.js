const express = require('express');
const router = express.Router({ mergeParams: true });
const { upload, validateVideoUpload, handleUploadError } = require('../middleware/fileUpload');
const { uploadVideoFile, getUploadStatus } = require('../controllers/videoUploadController');
const { confirmVideoUpload } = require('../controllers/videoStorageController');
const { validateConfirmVideoRequest } = require('../middleware/videoValidation');
const { extractVideoDuration } = require('../controllers/videoDurationController');
const { validateExtractDurationRequest } = require('../middleware/durationValidation');
const { streamVideo, getVideoMetadata } = require('../controllers/videoStreamController');
const { protect } = require('../middleware/auth');

/**
 * PHASE 1: Video Upload Routes
 * 
 * POST   /api/lectures/:lectureId/upload-video    - Upload video file
 * GET    /api/lectures/:lectureId/upload-status   - Check upload status
 * 
 * PHASE 2: Video Confirmation Routes
 * 
 * POST   /api/lectures/:lectureId/confirm-video   - Move temp to permanent storage
 * 
 * PHASE 3: Duration Extraction Routes
 * 
 * POST   /api/lectures/:lectureId/extract-duration - Extract video duration
 * 
 * PHASE 4: Video Streaming Routes
 * 
 * GET    /api/lectures/:lectureId/stream         - Stream video file
 * GET    /api/lectures/:lectureId/video-metadata - Get video metadata for player
 */

// Protect all routes - must be logged in
router.use(protect);

// POST - Upload video file (Phase 1)
// Route: POST /api/lectures/:lectureId/upload-video
// Middleware chain:
// 1. protect - verify user is logged in
// 2. upload.single('video') - multer handles file upload
// 3. handleUploadError - handle multer errors
// 4. validateVideoUpload - validate uploaded file
// 5. uploadVideoFile - process and store file info
router.post(
  '/:lectureId/upload-video',
  upload,
  handleUploadError,
  validateVideoUpload,
  uploadVideoFile
);

// GET - Check upload status (Phase 1)
// Route: GET /api/lectures/:lectureId/upload-status
router.get('/:lectureId/upload-status', getUploadStatus);

// POST - Confirm video and move to permanent storage (Phase 2)
// Route: POST /api/lectures/:lectureId/confirm-video
// Body: { tempPath: string, fileName: string }
// Middleware chain:
// 1. protect - verify user is logged in
// 2. validateConfirmVideoRequest - validate request body
// 3. confirmVideoUpload - move file and update database
router.post(
  '/:lectureId/confirm-video',
  validateConfirmVideoRequest,
  confirmVideoUpload
);

// POST - Extract video duration (Phase 3)
// Route: POST /api/lectures/:lectureId/extract-duration
// Body: { videoPath: string }
// Middleware chain:
// 1. protect - verify user is logged in
// 2. validateExtractDurationRequest - validate request body
// 3. extractVideoDuration - extract duration using FFprobe and update database
router.post(
  '/:lectureId/extract-duration',
  validateExtractDurationRequest,
  extractVideoDuration
);

// GET - Stream video file (Phase 4)
// Route: GET /api/lectures/:lectureId/stream
// Headers: Range (optional) - for seeking support (e.g., "bytes=0-1023")
// Middleware chain:
// 1. protect - verify user is logged in
// 2. streamVideo - stream video with range request support
router.get(
  '/:lectureId/stream',
  streamVideo
);

// GET - Get video metadata (Phase 4)
// Route: GET /api/lectures/:lectureId/video-metadata
// Returns: Video metadata for frontend player
// Middleware chain:
// 1. protect - verify user is logged in
// 2. getVideoMetadata - return video metadata
router.get(
  '/:lectureId/video-metadata',
  getVideoMetadata
);

module.exports = router;