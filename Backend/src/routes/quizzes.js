const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createQuiz,
  getQuizzesByCourse,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  submitQuizAttempt,
  getQuizResults,
} = require('../controllers/quizController');

const router = express.Router();

// ⚠️ IMPORTANT: Specific routes MUST come BEFORE generic :id routes

// Get quizzes by course (MUST be BEFORE /:quizId)
router.get('/course/:courseId', getQuizzesByCourse);

// Create quiz (Teacher/Admin only)
router.post('/', protect, authorize('teacher', 'admin'), createQuiz);

// Add question to quiz (specific nested route - BEFORE /:quizId)
router.post('/:quizId/questions', protect, authorize('teacher', 'admin'), addQuestion);

// Submit quiz attempt (specific nested route - BEFORE /:quizId)
router.post('/:quizId/submit', protect, submitQuizAttempt);

// Get quiz results (specific nested route - BEFORE /:quizId)
router.get('/:quizId/results/:studentId', protect, getQuizResults);

// Get quiz by ID (generic :id route - MUST be LAST)
router.get('/:quizId', getQuizById);

// Update quiz (Teacher/Admin only)
router.put('/:quizId', protect, authorize('teacher', 'admin'), updateQuiz);

// Delete quiz (Teacher/Admin only)
router.delete('/:quizId', protect, authorize('teacher', 'admin'), deleteQuiz);

module.exports = router;
