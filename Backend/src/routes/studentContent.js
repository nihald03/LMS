const express = require('express');
const router = express.Router();

const {
  getCourseDetails,
  viewLecture,
  getCourseLectures,
  getCourseAssignments,
  getCourseQuizzes,
  getCourseAnnouncements,
  getLectureQuestions,
  getActivityLog,
  trackLectureView,
} = require('../controllers/studentContentController');

const {
  getStudentEnrollments, // ✅ IMPORT CORRECT FUNCTION
} = require('../controllers/enrollmentController');

const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// 🔒 All routes require authentication + student role
router.use(protect);
router.use(authorize(ROLES.STUDENT));

/**
 * ============================
 * STUDENT COURSES (PHASE 6)
 * ============================
 */

// ✅ GET /api/students/courses
// Returns enrolled courses for logged-in student
router.get('/courses', getStudentEnrollments);

// Course details
router.get('/courses/:courseId', getCourseDetails);

/**
 * ============================
 * COURSE CONTENT
 * ============================
 */

router.get('/courses/:courseId/lectures', getCourseLectures);
router.get('/courses/:courseId/assignments', getCourseAssignments);
router.get('/courses/:courseId/quizzes', getCourseQuizzes);
router.get('/courses/:courseId/announcements', getCourseAnnouncements);

/**
 * ============================
 * LECTURES
 * ============================
 */

router.get('/lectures/:lectureId', viewLecture);
router.get('/lectures/:lectureId/questions', getLectureQuestions);
router.post('/lectures/:lectureId/track-view', trackLectureView);

/**
 * ============================
 * ACTIVITY LOG
 * ============================
 */

router.get('/activity-log', getActivityLog);

module.exports = router;
