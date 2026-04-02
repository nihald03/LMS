const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createLecture,
  getLecturesByCourse,
  getLectureById,
  updateLecture,
  deleteLecture,
  addInLectureQuestion,
  markAttendance,
  respondToInLectureQuestion,
  getLectureQuestionAnalytics,
} = require('../controllers/lectureController.js');
const { streamVideo, getVideoMetadata } = require('../controllers/videoStreamController.js');

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE generic :id routes
// Otherwise "course" will be treated as a lectureId
// Student responds to in-lecture question (Attendance trigger)
router.post(
  '/:lectureId/in-lecture-questions/:questionId/respond',
  protect,
  authorize('student'),
  respondToInLectureQuestion
);

// Video stream endpoint (MUST be BEFORE generic /:lectureId route)
router.get('/:lectureId/stream', protect, streamVideo);

// Video metadata endpoint (MUST be BEFORE generic /:lectureId route)
router.get('/:lectureId/video-metadata', protect, getVideoMetadata);

// Get lectures by course (generic path - MUST be BEFORE /:lectureId)
router.get('/course/:courseId', getLecturesByCourse);

// Create lecture (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createLecture);

// Add in-lecture question (Teacher/Admin only) (specific nested route - BEFORE /:lectureId)
router.post('/:lectureId/in-lecture-questions', protect, authorize('teacher', 'admin'), addInLectureQuestion);

// Get analytics for in-lecture questions (Teacher/Admin only) (specific nested route - BEFORE /:lectureId)
router.get('/:lectureId/in-lecture-questions/analytics', protect, authorize('teacher', 'admin'), getLectureQuestionAnalytics);

// Mark attendance (Student) (specific nested route - BEFORE /:lectureId)
router.put('/:lectureId/attendance', protect, markAttendance);

// Get lecture by ID (generic :id route - MUST be LAST among GET)
router.get('/:lectureId', getLectureById);

// Update lecture (Teacher/Admin only)
router.put('/:lectureId', protect, authorize('teacher', 'admin'), updateLecture);

// Delete lecture (Teacher/Admin only)
router.delete('/:lectureId', protect, authorize('teacher', 'admin'), deleteLecture);

module.exports = router;


