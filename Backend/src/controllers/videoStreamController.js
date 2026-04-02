const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const jwt = require('jsonwebtoken');
const Lecture = require('../models/Lecture');
const Enrollment = require('../models/Enrollment');

const Teacher = require('../models/Teacher');

/**
 * PHASE 4: Stream Video File
 * GET /api/lectures/:lectureId/stream
 * 
 * Description:
 * - Receives video streaming request
 * - Validates lecture exists and user has access
 * - Implements HTTP range requests for seeking/scrubbing
 * - Streams video file in chunks for efficient playback
 * - Supports resume, pause, seek operations
 * - Returns video with proper headers for browser playback
 * 
 * Query params: 
 *   - start (optional): byte position to start streaming from
 *   - end (optional): byte position to end streaming at
 * 
 * Returns: Video stream with 200 OK or 206 Partial Content status
 */

const streamVideo = async (req, res) => {
  try {
    const { lectureId } = req.params;
    
    // Accept token from Authorization header OR query parameter
    let token = null;
    let userId = null;

    // Try Authorization header first
    if (req.user) {
      userId = req.user._id;
      token = req.headers.authorization?.replace('Bearer ', '');
    } 
    // Fallback to query parameter (for HTML5 video tag)
    else if (req.query.token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        userId = decoded.id;
        token = req.query.token;
      } catch (error) {
        console.error('Token verification error:', error.message);
      }
    }

    // If no valid token, reject
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // 1. Validate lectureId format
    if (!lectureId || !lectureId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    // 2. Check lecture exists and user has access
    const lecture = await Lecture.findById(lectureId)
      .populate('courseId', 'createdBy students title');
    
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // 3. Check user is teacher or enrolled student
    // Validate courseId exists
    if (!lecture.courseId) {
      return res.status(500).json({
        success: false,
        message: 'Lecture course reference not found'
      });
    }

    // Check if user is teacher
    const isTeacher = lecture.courseId.createdBy.toString() === userId.toString();

    // Check if user is enrolled student
    let isStudent = false;
    if (!isTeacher) {
      // Get student profile
      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId: lecture.courseId._id,
        status: { $in: ['active', 'completed'] }
      });

      isStudent = !!enrollment;
    }

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to stream this video'
      });
    }

    // 4. Check video exists and is ready
    if (!lecture.videoPath || lecture.videoUploadStatus !== 'ready') {
      return res.status(404).json({
        success: false,
        message: 'Video is not available for streaming',
        details: {
          hasVideo: !!lecture.videoPath,
          videoUploadStatus: lecture.videoUploadStatus,
          requiresUpload: !lecture.videoPath,
          requiresDuration: lecture.videoUploadStatus !== 'ready'
        }
      });
    }

    // 5. Verify video file exists on disk
    const videoPath = path.join(__dirname, '../../public', lecture.videoPath);
    const fileExists = await fileExistsAsync(videoPath);

    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    // 6. Get file size and MIME type
    const stats = await fs.stat(videoPath);
    const fileSize = stats.size;
    const mimeType = 'video/mp4';  // Assuming MP4 format
    const videoDuration = lecture.videoDuration || 0;

    // 7. Handle HTTP Range requests (for seeking, resume, etc.)
    const range = req.headers.range;
    
    if (range) {
      // Parse range header: "bytes=0-1023" or "bytes=1024-"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        return res.status(416).json({
          success: false,
          message: 'Requested range not satisfiable'
        });
      }

      // Set headers for partial content
      res.status(206).set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
        'X-Video-Duration': videoDuration,
        'X-Lecture-Title': lecture.title,
        'X-Content-Type-Options': 'nosniff'
      });

      // Stream partial content
      const stream = fsSync.createReadStream(videoPath, { start, end });
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });

    } else {
      // No range header - stream entire file
      res.status(200).set({
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'X-Video-Duration': videoDuration,
        'X-Lecture-Title': lecture.title,
        'X-Content-Type-Options': 'nosniff'
      });

      const stream = fsSync.createReadStream(videoPath);
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming video'
          });
        }
      });
    }

    // 8. Log streaming activity (optional - for analytics)
    console.log(`[STREAM] User ${userId} streaming lecture ${lectureId}`);

  } catch (error) {
    console.error('Error streaming video:', error);
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Error streaming video',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

/**
 * Get Video Metadata for Player
 * GET /api/lectures/:lectureId/video-metadata
 * 
 * Returns: Video information needed for frontend player
 * - duration
 * - size
 * - status
 * - title
 * - poster image (if available)
 */
const getVideoMetadata = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const userId = req.user._id;

    // Validate lectureId
    if (!lectureId || !lectureId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lecture ID format'
      });
    }

    // Get lecture
    const lecture = await Lecture.findById(lectureId)
      .populate('courseId', 'createdBy students title');

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Check access
    // Validate courseId exists
    if (!lecture.courseId) {
      return res.status(500).json({
        success: false,
        message: 'Lecture course reference not found'
      });
    }

    // Check if user is teacher
    const isTeacher = lecture.courseId.createdBy.toString() === userId.toString();

    // Check if user is enrolled student
    let isStudent = false;
    if (!isTeacher) {
      // Get student profile
      const student = await Student.findOne({ userId });
      if (student) {
        // Check enrollment in the course
        const enrollment = await Enrollment.findOne({
          studentId: student._id,
          courseId: lecture.courseId._id,
          status: { $in: ['active', 'completed'] }
        });
        isStudent = !!enrollment;
      }
    }

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this video'
      });
    }

    // Return metadata
    return res.status(200).json({
      success: true,
      data: {
        lectureId,
        lectureTitle: lecture.title,
        videoDuration: lecture.videoDuration || 0,  // in seconds
        videoSize: lecture.videoSize || 0,          // in bytes
        videoUploadStatus: lecture.videoUploadStatus,
        uploadedAt: lecture.videoUploadedAt,
        courseId: lecture.courseId._id,
        courseTitle: lecture.courseId.title,
        isReady: lecture.videoUploadStatus === 'ready',
        streamUrl: `/api/lectures/${lectureId}/stream`,
        canStream: lecture.videoUploadStatus === 'ready' && !!lecture.videoPath
      }
    });

  } catch (error) {
    console.error('Error getting video metadata:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching video metadata'
    });
  }
};

// Helper function - Check if file exists (async)
const fileExistsAsync = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  streamVideo,
  getVideoMetadata
};
