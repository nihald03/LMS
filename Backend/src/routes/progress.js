/**
 * Progress Routes - Student progress and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Student Progress Routes
 */

// GET /api/progress/courses/:courseId/progress
// Get student's progress in a specific course
router.get(
  '/courses/:courseId/progress',
  protect,
  authorize('student', 'teacher', 'admin'),
  progressController.getCourseProgress
);

// GET /api/progress/students/:studentId/dashboard
// Get student's main dashboard
router.get(
  '/students/:studentId/dashboard',
  protect,
  authorize('student', 'admin'),
  progressController.getStudentDashboard
);

// GET /api/progress/students/:studentId/grades
// Get all grades for a student
router.get(
  '/students/:studentId/grades',
  protect,
  authorize('student', 'admin'),
  progressController.getStudentGrades
);

// GET /api/progress/:enrollmentId/grade
// Get aggregated course grade for a student (by enrollment)
router.get(
  '/:enrollmentId/grade',
  protect,
  authorize('student', 'teacher', 'admin'),
  progressController.getStudentCourseGrade
);

// GET /api/progress/courses/:courseId/grades/:studentId
// Get grade breakdown for student in course
router.get(
  '/courses/:courseId/grades/:studentId',
  protect,
  authorize('student', 'teacher', 'admin'),
  progressController.getCourseGradeDetails
);

// GET /api/progress/students/:studentId/transcript
// Get student's full transcript
router.get(
  '/students/:studentId/transcript',
  protect,
  authorize('student', 'admin'),
  progressController.getStudentTranscript
);

// GET /api/progress/students/:studentId/attendance
// Get student's attendance records
router.get(
  '/students/:studentId/attendance',
  protect,
  authorize('student', 'admin'),
  progressController.getAttendanceSummary
);

// GET /api/progress/courses/:courseId/progress-report/:studentId
// Get detailed progress report for student
router.get(
  '/courses/:courseId/progress-report/:studentId',
  protect,
  authorize('student', 'teacher', 'admin'),
  progressController.getProgressReport
);

/**
 * Teacher & Admin Routes
 */

// GET /api/progress/courses/:courseId/class-progress-summary
// Get summary of all students' progress in a course
router.get(
  '/courses/:courseId/class-progress-summary',
  protect,
  authorize('teacher', 'admin'),
  progressController.getClassProgressSummary
);

module.exports = router;
