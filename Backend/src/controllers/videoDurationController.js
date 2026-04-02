const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { execSync } = require('child_process');
const Lecture = require('../models/Lecture');

/**
 * PHASE 3: Extract Video Duration
 * POST /api/lectures/:lectureId/extract-duration
 * 
 * Description:
 * - Receives video file path (from Phase 2)
 * - Uses FFprobe to extract duration
 * - Updates database with duration in seconds
 * - Changes status to "ready"
 * 
 * Body: {
 *   videoPath: string   // e.g., "uploads/lectures/69aaf11ea970bf42f8ac4e69/video.mp4"
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     lectureId: string,
 *     videoDuration: number,  // in seconds
 *     videoUploadStatus: string,  // "ready"
 *     readyForStreaming: boolean
 *   }
 * }
 */

const extractVideoDuration = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { videoPath } = req.body;
    const userId = req.user._id;

    // 1. Validate input
    if (!videoPath || typeof videoPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing videoPath'
      });
    }

    if (videoPath.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'videoPath cannot be empty'
      });
    }

    // Security: Prevent directory traversal
    if (videoPath.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video path - directory traversal detected'
      });
    }

    // 2. Check lecture exists and user is authorized
    const lecture = await Lecture.findById(lectureId)
      .populate('courseId');
    
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'Lecture not found'
      });
    }

    // Verify teacher owns this course
    if (lecture.courseId.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to extract duration for this lecture'
      });
    }

    // 3. Verify video file exists
    const fullVideoPath = path.join(__dirname, '../../public', videoPath);
    const videoFileExists = await fileExists(fullVideoPath);
    
    if (!videoFileExists) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    // 4. Extract duration using FFprobe
    let durationSeconds = 0;
    try {
      // Try using ffprobe to get duration
      const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${fullVideoPath}"`;
      const duration = execSync(command, { encoding: 'utf-8', maxBuffer: 1024 * 1024 });
      durationSeconds = Math.round(parseFloat(duration.trim()));

      if (isNaN(durationSeconds) || durationSeconds <= 0) {
        throw new Error('Invalid duration value');
      }
    } catch (error) {
      console.error('FFprobe error:', error.message);
      
      // Fallback: Try using ffmpeg if ffprobe fails
      try {
        const command = `ffmpeg -i "${fullVideoPath}" 2>&1 | findstr /i "Duration"`;
        const output = execSync(command, { encoding: 'utf-8', shell: true });
        // Parse format: "Duration: HH:MM:SS.ms"
        const match = output.match(/Duration: (\d+):(\d+):(\d+)/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseInt(match[3]);
          durationSeconds = hours * 3600 + minutes * 60 + seconds;
        } else {
          throw new Error('Could not parse duration');
        }
      } catch (fallbackError) {
        console.error('FFmpeg fallback error:', fallbackError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to extract video duration. Ensure FFmpeg/FFprobe is installed.',
          error: 'FFmpeg not available'
        });
      }
    }

    // 5. Update database with duration and status
    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      {
        videoDuration: durationSeconds,
        videoUploadStatus: 'ready'
      },
      { new: true }
    );

    // 6. Return success
    console.log(`[Phase 3] Duration extracted for lecture ${lectureId}: ${durationSeconds}s`);
    
    return res.status(200).json({
      success: true,
      message: 'Video duration extracted successfully',
      data: {
        lectureId: updatedLecture._id,
        videoDuration: updatedLecture.videoDuration,
        durationFormatted: formatDuration(durationSeconds),
        videoUploadStatus: updatedLecture.videoUploadStatus,
        readyForStreaming: true
      }
    });

  } catch (error) {
    console.error('Error in extractVideoDuration:', error);
    return res.status(500).json({
      success: false,
      message: 'Error extracting video duration',
      error: error.message
    });
  }
};

/**
 * Helper function to check if file exists
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Helper function to format duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (HH:MM:SS)
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

module.exports = {
  extractVideoDuration
};
