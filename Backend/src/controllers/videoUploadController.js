const fs = require('fs');
const path = require('path');
const Lecture = require('../models/Lecture');

/**
 * PHASE 1: Upload Video File
 * POST /api/lectures/:lectureId/upload-video
 * 
 * Description:
 * - Accepts MP4 file upload
 * - Stores file in temporary storage
 * - Validates file type and size
 * - Returns temporary file path for client confirmation
 * 
 * Body: FormData with 'video' field
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     fileName: string,
 *     fileSize: number (bytes),
 *     fileType: string,
 *     tempPath: string,
 *     uploadedAt: timestamp
 *   }
 * }
 */
const uploadVideoFile = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Validate lectureId
    if (!lectureId || !lectureId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    // Check if lecture exists and user is authorized
    const lecture = await Lecture.findById(lectureId).populate('courseId');

    if (!lecture) {
      // Clean up uploaded file if lecture doesn't exist
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Check authorization - user must be teacher of the course
    if (lecture.courseId.createdBy.toString() !== req.user._id.toString()) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload videos for this lecture'
      });
    }

    // File details from multer
    const fileName = req.file.filename;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const tempPath = req.file.path;

    // Get relative path for storage in database later
    const relativePath = path.relative(
      path.join(__dirname, '../../public'),
      tempPath
    );

    // Phase 1: Update database with temporary file info
    // This ensures the video path is immediately visible in the database
    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      {
        videoPath: relativePath,
        videoSize: fileSize,
        videoUploadedAt: new Date(),
        videoUploadStatus: 'uploaded'
      },
      { new: true }
    );

    // Phase 1: Return temporary file info
    // Phase 2 will handle moving to permanent storage
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully. Ready for processing.',
      data: {
        fileName,
        fileSize,
        fileType,
        tempPath: relativePath,
        videoPath: relativePath,
        uploadedAt: new Date(),
        lectureId,
        videoUploadStatus: 'uploaded'
      }
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Clean up file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error uploading video file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * PHASE 1: Get Upload Status
 * GET /api/lectures/:lectureId/upload-status
 * 
 * Returns current video upload status for a lecture
 */
const getUploadStatus = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        lectureId,
        hasVideo: !!lecture.videoPath,
        videoPath: lecture.videoPath || null,
        videoDuration: lecture.videoDuration || null,
        uploadedAt: lecture.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching upload status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching upload status'
    });
  }
};

module.exports = {
  uploadVideoFile,
  getUploadStatus
};
