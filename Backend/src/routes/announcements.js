const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncementsByCourse,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  getReadStats,
} = require('../controllers/announcementController');

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE generic :id routes

// Get announcements by course (MUST be BEFORE /:announcementId)
router.get('/course/:courseId', getAnnouncementsByCourse);

// Create announcement (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createAnnouncement);

// Mark announcement as read (specific nested route - BEFORE /:announcementId)
router.put('/:announcementId/read', protect, markAsRead);

// Get read statistics (specific nested route - BEFORE /:announcementId)
router.get('/:announcementId/read-stats', protect, authorize('teacher', 'admin'), getReadStats);

// Get announcement by ID (generic :id route - MUST be LAST)
router.get('/:announcementId', getAnnouncementById);

// Update announcement (Teacher/Admin only)
router.put('/:announcementId', protect, authorize('teacher', 'admin'), updateAnnouncement);

// Delete announcement (Teacher/Admin only)
router.delete('/:announcementId', protect, authorize('teacher', 'admin'), deleteAnnouncement);

module.exports = router;
