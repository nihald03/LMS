/**
 * PHASE 3: Duration Extraction Validation Middleware
 * Validates extract-duration request body
 */

const validateExtractDurationRequest = async (req, res, next) => {
  try {
    const { videoPath } = req.body;

    // Validate videoPath
    if (!videoPath) {
      return res.status(400).json({
        success: false,
        message: 'videoPath is required'
      });
    }

    if (typeof videoPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'videoPath must be a string'
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

    // Validate that path contains expected structure
    if (!videoPath.includes('uploads')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video path format - must contain uploads directory'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating request',
      error: error.message
    });
  }
};

module.exports = {
  validateExtractDurationRequest
};
