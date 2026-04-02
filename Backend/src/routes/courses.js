const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// Import all course controller functions
const courseController = require('../controllers/courseController');
const enrollmentController = require('../controllers/enrollmentController');

const router = express.Router();

// ============================================================================
// POST ROUTES
// ============================================================================

// Create course (Teacher/Admin only)
router.post(
  '/',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  courseController.createCourse
);

// Enroll student in course
router.post(
  '/enroll/student',
  protect,
  authorize(ROLES.STUDENT),
  enrollmentController.enrollStudent
);

// ============================================================================
// GET ROUTES - SPECIFIC PATHS (before generic :courseId)
// ============================================================================

// Get all courses (Public)
router.get('/', courseController.getAllCourses);

// Get student's enrolled courses
router.get(
  '/student/my-courses',
  protect,
  authorize(ROLES.STUDENT),
  enrollmentController.getStudentEnrollments
);

// Get course students list (Teacher/Admin)
router.get(
  '/course/:courseId/students',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  enrollmentController.getCourseEnrollments
);

// Get enrollment by ID
router.get(
  '/enrollment/:enrollmentId',
  protect,
  authorize(ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN),
  enrollmentController.getEnrollmentById
);

// Get courses by teacher ID
router.get(
  '/teacher/:teacherId',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  courseController.getCoursesByTeacher
);

// ============================================================================
// GET ROUTES - COURSEID WITH SUFFIX (before generic /:courseId)
// ============================================================================

// Get course statistics
router.get(
  '/:courseId/stats',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  courseController.getCourseStats
);

// Get course analytics (for teacher dashboard)
router.get(
  '/:courseId/analytics',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  require('../controllers/teacherController').getCourseAnalytics
);

// Get class progress summary
router.get(
  '/:courseId/class-progress-summary',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  require('../controllers/teacherController').getClassProgressSummary
);

// Get engagement metrics
router.get(
  '/:courseId/engagement-metrics',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  require('../controllers/teacherController').getEngagementMetrics
);

// ============================================================================
// DELETE ROUTES
// ============================================================================

// Drop course
router.delete(
  '/drop/:enrollmentId',
  protect,
  authorize(ROLES.STUDENT),
  enrollmentController.dropCourse
);

// Delete course
router.delete(
  '/:courseId',
  protect,
  authorize(ROLES.ADMIN),
  courseController.deleteCourse
);

// ============================================================================
// PUT ROUTES
// ============================================================================

// Update student marks
router.put(
  '/marks/:enrollmentId',
  protect,
  authorize(ROLES.TEACHER),
  enrollmentController.updateMarks
);

// Submit grade
router.put(
  '/grade/:enrollmentId',
  protect,
  authorize(ROLES.TEACHER),
  enrollmentController.submitGrade
);

// Update course
router.put(
  '/:courseId',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  courseController.updateCourse
);

// ============================================================================
// GET ROUTES - ENROLLMENT STATS
// ============================================================================

// Get enrollment statistics
router.get(
  '/enrollment-stats/:enrollmentId',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  enrollmentController.getEnrollmentStats
);

// ============================================================================
// GENERIC GET ROUTE - MUST BE LAST (catch-all for /:courseId)
// ============================================================================

// Get course by ID (Public)
router.get('/:courseId', courseController.getCourseById);

module.exports = router;
