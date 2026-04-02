const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize, isStudent, isTeacher, isAdmin } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes (all authenticated users)
router.get('/me', protect, authController.getCurrentUser);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.post('/logout', protect, authController.logout);

module.exports = router;
