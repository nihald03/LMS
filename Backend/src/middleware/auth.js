const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse } = require('../utils/responseHandler');

// ===================== PROTECT =====================
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header first
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Fallback to query parameter (for HTML5 video streaming)
    else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'No token provided. Please log in.',
          []
        )
      );
    }

    // VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FETCH USER
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

    // ATTACH USER
    req.user = user;

    // 🔴 DEBUG LOG (VERY IMPORTANT)
    console.log('AUTH USER:', {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'Token has expired',
          [error.message]
        )
      );
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json(
      createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication failed',
        [error.message]
      )
    );
  }
};

// ===================== AUTHORIZE =====================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(
        createErrorResponse(
          HTTP_STATUS.UNAUTHORIZED,
          'Please log in first',
          []
        )
      );
    }

    console.log('AUTHORIZE CHECK:', {
      requiredRoles: roles,
      userRole: req.user.role,
    });

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          `Only ${roles.join(', ')} can access this resource`,
          []
        )
      );
    }

    next();
  };
};
