/**
 * PHASE 2: Validation Middleware
 * Validates confirm-video request body
 */

const validateConfirmVideoRequest = async (req, res, next) => {
  try {
    const { tempPath, fileName } = req.body;

    // Validate tempPath
    if (!tempPath) {
      return res.status(400).json({
        success: false,
        message: 'tempPath is required'
      });
    }

    if (typeof tempPath !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'tempPath must be a string'
      });
    }

    if (tempPath.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tempPath cannot be empty'
      });
    }

    // Validate fileName
    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: 'fileName is required'
      });
    }

    if (typeof fileName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'fileName must be a string'
      });
    }

    if (fileName.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'fileName cannot be empty'
      });
    }

    // Security: Prevent directory traversal
    if (tempPath.includes('..') || fileName.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path - directory traversal detected'
      });
    }

    // Note: Accept both forward slashes (/) and backslashes (\) as valid path separators
    // Windows paths can use either format

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
  validateConfirmVideoRequest
};
