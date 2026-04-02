const express = require('express');
const router = express.Router();

const {
  enrollStudent,
  getEnrollmentDetails,
  dropCourse,
  getStudentEnrollments,
  getCourseEnrollments,
  updateEnrollmentStatus,
  getEnrollmentStats,
} = require('../controllers/enrollmentController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// 🔒 All routes require authentication
router.use(protect);

// =======================
// STUDENT ROUTES
// =======================

// Enroll in a course
router.post('/enroll', authorize(ROLES.STUDENT), enrollStudent);

// Get logged-in student's enrollments
router.get('/my-enrollments', authorize(ROLES.STUDENT), getStudentEnrollments);

// Drop a course
router.post('/:enrollmentId/drop', authorize(ROLES.STUDENT), dropCourse);

// =======================
// TEACHER / ADMIN ROUTES
// =======================

// View students in a course
router.get(
  '/course/:courseId/students',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  getCourseEnrollments
);

// Update enrollment status
router.put(
  '/:enrollmentId/status',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  updateEnrollmentStatus
);

// Admin stats
router.get(
  '/stats/all',
  authorize(ROLES.ADMIN),
  getEnrollmentStats
);

// =======================
// ⚠️ MUST BE LAST (VERY IMPORTANT)
// =======================

// Get enrollment details by ID
router.get(
  '/:enrollmentId',
  authorize(ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN),
  getEnrollmentDetails
);

module.exports = router;
