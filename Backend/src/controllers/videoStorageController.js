const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const Lecture = require('../models/Lecture');

/**
 * PHASE 2: Confirm Video Upload and Move to Permanent Storage
 * POST /api/lectures/:lectureId/confirm-video
 * 
 * Description:
 * - Receives temporary file path from Phase 1
 * - Validates file exists and is valid video
 * - Moves file from temp → permanent storage
 * - Updates database with real video path
 * - Changes status to "uploaded"
 * 
 * Body: {
 *   tempPath: string,      // e.g., "uploads/temp/lecture-123-abc.mp4"
 *   fileName: string       // e.g., "lecture-123-abc.mp4"
 * }
 * 
 * Returns: {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     lectureId: string,
 *     videoPath: string,
 *     videoSize: number,
 *     uploadedAt: timestamp,
 *     videoUploadStatus: string,
 *     readyForProcessing: boolean
 *   }
 * }
 */

const confirmVideoUpload = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { tempPath, fileName } = req.body;
    const userId = req.user._id;

    // 1. Validate input
    if (!tempPath || typeof tempPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing tempPath'
      });
    }

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing fileName'
      });
    }

    // Security: Prevent directory traversal
    if (tempPath.includes('..') || fileName.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path - directory traversal detected'
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
        message: 'You are not authorized to confirm video for this lecture'
      });
    }

    // 3. Verify temp file exists
    const fullTempPath = path.join(__dirname, '../../public', tempPath);
    const tempFileExists = await fileExists(fullTempPath);
    
    if (!tempFileExists) {
      return res.status(404).json({
        success: false,
        message: 'Temporary file not found. Please upload again.'
      });
    }

    // 4. Validate file format/extension
    const fileExtension = path.extname(fileName).toLowerCase();
    const validExtensions = ['.mp4', '.webm', '.mov', '.qt'];
    
    if (!validExtensions.includes(fileExtension)) {
      // Clean up temp file
      await deleteFile(fullTempPath);
      
      return res.status(400).json({
        success: false,
        message: `Invalid file extension. Only ${validExtensions.join(', ')} allowed. Received: ${fileExtension}`
      });
    }

    // 5. Create permanent directory for this lecture
    const uploadDir = path.join(__dirname, '../../public/uploads');
    const lectureStorageDir = path.join(uploadDir, 'lectures', lectureId.toString());
    
    await createDirectoryIfNotExists(lectureStorageDir);

    // 6. Generate permanent file path
    const permanentFileName = `video${fileExtension}`;
    const permanentPath = path.join(lectureStorageDir, permanentFileName);
    const permanentPathRelative = path.join('uploads/lectures', lectureId.toString(), permanentFileName);

    // 7. Copy temp file to permanent location
    try {
      await fs.copyFile(fullTempPath, permanentPath);
    } catch (error) {
      console.error('Error copying file:', error);
      return res.status(500).json({
        success: false,
        message: 'Error copying file to permanent storage',
        error: error.message
      });
    }

    // 8. Verify copy was successful
    const permFileExists = await fileExists(permanentPath);
    if (!permFileExists) {
      throw new Error('Failed to copy file to permanent location');
    }

    // 9. Get file size
    let fileSize = 0;
    try {
      const fileStats = await fs.stat(permanentPath);
      fileSize = fileStats.size;
    } catch (error) {
      console.error('Error getting file stats:', error);
    }

    // 10. Update database with real video info
    const updatedLecture = await Lecture.findByIdAndUpdate(
      lectureId,
      {
        videoPath: permanentPathRelative,
        videoSize: fileSize,
        videoUploadStatus: 'uploaded',
        videoUploadedAt: new Date()
      },
      { new: true }
    );

    if (!updatedLecture) {
      // Clean up if update fails
      await deleteFile(permanentPath);
      return res.status(500).json({
        success: false,
        message: 'Failed to update database'
      });
    }

    // 11. Delete temp file
    await deleteFile(fullTempPath);

    // 12. Return success response
    res.status(200).json({
      success: true,
      message: 'Video confirmed and moved to permanent storage successfully',
      data: {
        lectureId: updatedLecture._id,
        videoPath: updatedLecture.videoPath,
        videoSize: updatedLecture.videoSize,
        uploadedAt: updatedLecture.videoUploadedAt,
        videoUploadStatus: updatedLecture.videoUploadStatus,
        readyForProcessing: true
      }
    });

  } catch (error) {
    console.error('Error in confirmVideoUpload:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error confirming video upload',
      error: error.message
    });
  }
};

/**
 * Helper function: Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function: Delete file
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
  }
}

/**
 * Helper function: Create directory if not exists
 */
async function createDirectoryIfNotExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Directory ensured: ${dirPath}`);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

module.exports = {
  confirmVideoUpload
};
