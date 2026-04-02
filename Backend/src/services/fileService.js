/**
 * File Service
 * Handles file uploads, validation, and management
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

class FileService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate assignment submission file
   * @param {Object} file - Express file object
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  async validateAssignmentFile(file, options = {}) {
    try {
      const {
        allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize = 10 * 1024 * 1024, // 10MB default
      } = options;

      // Check file exists
      if (!file) {
        return { valid: false, error: 'No file provided' };
      }

      // Check file size
      if (file.size > maxSize) {
        return { valid: false, error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` };
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
      }

      // TODO: For PDF files, validate they're readable and not corrupted
      // if (file.mimetype === 'application/pdf') {
      //   const isValidPDF = await this.validatePDF(file);
      //   if (!isValidPDF) {
      //     return { valid: false, error: 'Invalid or corrupted PDF file' };
      //   }
      // }

      return { valid: true };
    } catch (error) {
      console.error('Error validating file:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Validate PDF file
   */
  async validatePDF(file) {
    try {
      // TODO: Parse PDF and verify it's readable
      const data = await pdfParse(file.buffer);
      return data && data.numpages > 0;
    } catch (error) {
      console.error('Error validating PDF:', error);
      return false;
    }
  }

  /**
   * Save uploaded file
   * @param {Object} file - Express file object
   * @param {String} destination - Destination path relative to uploadDir
   * @returns {Promise<Object>} File info
   */
  async saveFile(file, destination) {
    try {
      const dirPath = path.join(this.uploadDir, destination);
      
      // Ensure destination directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `${timestamp}-${randomStr}-${file.originalname}`;
      const filePath = path.join(dirPath, filename);

      // Save file
      fs.writeFileSync(filePath, file.buffer);

      return {
        filename: file.originalname,
        savedAs: filename,
        path: filePath,
        url: `/uploads/${destination}/${filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get file stream for download
   */
  getFileStream(filePath) {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }
      return fs.createReadStream(fullPath);
    } catch (error) {
      console.error('Error getting file stream:', error);
      throw error;
    }
  }

  /**
   * Clean up old files
   */
  async cleanupOldFiles(ageInDays = 90) {
    // TODO: Implement cleanup of files older than specified days
  }
}

module.exports = new FileService();
