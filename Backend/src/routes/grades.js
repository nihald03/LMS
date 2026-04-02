const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');
const gradeController = require('../controllers/gradeController');

const router = express.Router();

// ⚠️ All routes require authentication
router.use(protect);

/**
 * @route   GET /api/grades/course/:courseId
 * @desc    Get all grades for a course
 * @access  Private (Teacher/Admin of that course)
 */
router.get(
  '/course/:courseId',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  gradeController.getCourseGrades
);

/**
 * @route   GET /api/grades/course/:courseId/export
 * @desc    Export grades to CSV
 * @access  Private (Teacher/Admin of that course)
 */
router.get(
  '/course/:courseId/export',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  gradeController.exportGradesToCSV
);

/**
 * @route   GET /api/grades/student/:studentId
 * @desc    Get student's grades across all courses
 * @access  Private (Student viewing own grades, or Teacher/Admin)
 */
router.get(
  '/student/:studentId',
  authorize(ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN),
  gradeController.getStudentGrades
);

/**
 * @route   GET /api/grades/:gradeId
 * @desc    Get specific grade record
 * @access  Private
 */
router.get(
  '/:gradeId',
  gradeController.getGradeById
);

/**
 * @route   POST /api/grades
 * @desc    Create or update a grade
 * @access  Private (Teacher/Admin)
 */
router.post(
  '/',
  authorize(ROLES.TEACHER, ROLES.ADMIN),
  gradeController.createOrUpdateGrade
);

module.exports = router;
