const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ROLES, ERROR_MESSAGES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// Generate JWT Token
const generateToken = (userId, expiresIn) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRE,
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide all required fields',
          ['name', 'email', 'password', 'confirmPassword']
        )
      );
    }

    // Validate role
    if (role && !Object.values(ROLES).includes(role)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Invalid role provided',
          ['role']
        )
      );
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        createErrorResponse(
          HTTP_STATUS.CONFLICT,
          'Email already registered',
          ['email']
        )
      );
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      confirmPassword,
      role: role || ROLES.STUDENT,
    });

    // If student, create student profile
    if (user.role === ROLES.STUDENT) {
      const studentId = `STU-${user._id.toString().slice(-8).toUpperCase()}`;
      await Student.create({
        userId: user._id,
        studentId,
      });
    }

    // If teacher, create teacher profile
    if (user.role === ROLES.TEACHER) {
      const teacherId = `TEACH-${user._id.toString().slice(-8).toUpperCase()}`;
      await Teacher.create({
        userId: user._id,
        teacherId,
        department: '', // Will be updated later
      });
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return success response
    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'User registered successfully', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
      })
    );
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Registration failed',
        [error.message]
      )
    );
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide email and password',
          ['email', 'password']
        )
      );
    }

    // Check if user exists and get password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'Invalid credentials',
          []
        )
      );
    }

    // Check password
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'Invalid credentials',
          []
        )
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'Your account has been deactivated',
          []
        )
      );
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Return success response
    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
      })
    );
  } catch (error) {
    console.error('Login error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Login failed',
        [error.message]
      )
    );
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Refresh token is required',
          ['refreshToken']
        )
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'User not found',
          []
        )
      );
    }

    // Generate new token
    const newToken = generateToken(user._id);

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Token refreshed successfully', {
        token: newToken,
      })
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid refresh token',
        [error.message]
      )
    );
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'User not found',
          []
        )
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'User retrieved successfully', {
        user: user.toJSON(),
      })
    );
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve user',
        [error.message]
      )
    );
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Logged out successfully', {})
    );
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Logout failed',
        [error.message]
      )
    );
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'User not found',
          []
        )
      );
    }

    let profile = { user: user.toJSON() };

    // If student, get student profile
    if (user.role === ROLES.STUDENT) {
      const student = await Student.findOne({ userId: user._id });
      profile.student = student;
    }

    // If teacher, get teacher profile
    if (user.role === ROLES.TEACHER) {
      const teacher = await Teacher.findOne({ userId: user._id });
      profile.teacher = teacher;
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Profile retrieved successfully', profile)
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve profile',
        [error.message]
      )
    );
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'User not found', [])
      );
    }

    // Update fields
    if (name) user.name = name.trim();
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Profile updated successfully', {
        user: user.toJSON()
      })
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to update profile',
        [error.message]
      )
    );
  }
};
