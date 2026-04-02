/**
 * Teacher Routes - Dashboard and Analytics
 */

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

/**
 * Teacher Dashboard
 */
router.get(
  '/:teacherId/dashboard',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.getTeacherDashboard
);

/**
 * Course Analytics
 */
router.get(
  '/:courseId/analytics',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.getCourseAnalytics
);

/**
 * Student Progress in Course
 */
router.get(
  '/:courseId/students/:studentId/progress',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN, ROLES.STUDENT),
  teacherController.getStudentProgressInCourse
);

/**
 * Class Progress Summary
 */
router.get(
  '/:courseId/class-progress-summary',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.getClassProgressSummary
);

/**
 * Engagement Metrics
 */
router.get(
  '/:courseId/engagement-metrics',
  protect,
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  teacherController.getEngagementMetrics
);

module.exports = router;
