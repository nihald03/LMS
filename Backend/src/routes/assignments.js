const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createAssignment,
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  closeAssignment,
  submitAssignment,
  getMySubmission,
  resubmitAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  addComment,
  getAssignmentAnalytics,
  getClassAnalytics,
  getPendingSubmissionsForTeacher,
  getSubmissionById
} = require('../controllers/assignmentControllerV2');
const upload = require('../middleware/upload');

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE generic :id routes

// ✅ Get single submission details
router.get(
  '/submissions/:submissionId',
  protect,
  authorize('teacher', 'admin'),
  getSubmissionById
);

// Create assignment (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createAssignment);

// Get pending submissions for teacher (MUST come before :assignmentId routes)
router.get('/teacher/pending', protect, authorize('teacher', 'admin'), getPendingSubmissionsForTeacher);

// Grade a submission (MUST come before :assignmentId routes)
router.post('/submissions/:submissionId/grade', protect, authorize('teacher', 'admin'), gradeSubmission);

// Add comment to submission (MUST come before :assignmentId routes)
router.post('/submissions/:submissionId/comment', protect, authorize('teacher', 'admin'), addComment);

// Get class-level analytics (MUST come before :courseId as catch-all)
router.get('/course/:courseId/analytics', protect, authorize('teacher', 'admin'), getClassAnalytics);

// Get assignments by course (MUST come before :assignmentId as catch-all)
router.get('/course/:courseId', protect, getAssignmentsByCourse);

// Submit assignment (file upload)
router.post('/:assignmentId/submit', protect, upload.single('file'), submitAssignment);

// Get student's own submission
router.get('/:assignmentId/my-submission', protect, getMySubmission);

// Resubmit assignment (file upload)
router.post('/:assignmentId/resubmit', protect, upload.single('file'), resubmitAssignment);

// Publish assignment
router.post('/:assignmentId/publish', protect, authorize('teacher', 'admin'), publishAssignment);

// Close assignment
router.post('/:assignmentId/close', protect, authorize('teacher', 'admin'), closeAssignment);

// Get all submissions for assignment
router.get('/:assignmentId/submissions', protect, authorize('teacher', 'admin'), getAssignmentSubmissions);

// Get analytics for assignment
router.get('/:assignmentId/analytics', protect, authorize('teacher', 'admin'), getAssignmentAnalytics);

// Get assignment by ID (generic :id route - MUST be LAST)
router.get('/:assignmentId', protect, getAssignmentById);

// Update assignment
router.put('/:assignmentId', protect, authorize('teacher', 'admin'), updateAssignment);

// Delete assignment
router.delete('/:assignmentId', protect, authorize('teacher', 'admin'), deleteAssignment);

module.exports = router;
