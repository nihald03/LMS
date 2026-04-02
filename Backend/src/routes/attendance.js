const express = require('express');
const router = express.Router();

// ✅ FIX: import BOTH protect & authorize from auth.js
const { protect, authorize } = require('../middleware/auth');

const { ROLES } = require('../utils/constants');
const attendanceController = require('../controllers/attendanceController');

// ===================== STUDENT ROUTES =====================

// Get attendance breakdown for a specific enrollment (student: own only)
router.get(
  '/:enrollmentId/breakdown',
  protect,
  authorize(ROLES.STUDENT),
  attendanceController.getStudentAttendanceBreakdown
);

// Get attendance across all student courses
router.get(
  '/student/courses',
  protect,
  authorize(ROLES.STUDENT),
  attendanceController.getStudentCourseAttendance
);

// ===================== TEACHER ROUTES =====================

// Get course attendance analytics
router.get(
  '/courses/:courseId/analytics',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  attendanceController.getCourseAttendanceAnalytics
);

// Get defaulter list for a course
router.get(
  '/courses/:courseId/defaulters',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  attendanceController.getCourseDefaulterList
);

// ===================== ADMIN ROUTES =====================

// Get all defaulters
router.get(
  '/defaulters',
  protect,
  authorize(ROLES.ADMIN),
  attendanceController.getAllDefaulters
);

// Get attendance config
router.get(
  '/config/:courseId',
  protect,
  authorize(ROLES.ADMIN),
  attendanceController.getAttendanceConfig
);

// Update attendance config
router.put(
  '/config/:courseId',
  protect,
  authorize(ROLES.ADMIN),
  attendanceController.updateAttendanceConfig
);

module.exports = router;
