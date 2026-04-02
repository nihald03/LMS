module.exports = {
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  ROLES: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
  },

  ENROLLMENT_STATUS: {
    ACTIVE: 'active',
    DROPPED: 'dropped',
    COMPLETED: 'completed',
  },

  SUBMISSION_STATUS: {
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    DRAFT: 'draft',
  },

  QUESTION_TYPES: {
    MCQ: 'mcq',
    SHORT_ANSWER: 'short_answer',
    ESSAY: 'essay',
  },

  ATTENDANCE_METHOD: {
    IN_LECTURE_QUESTION: 'in_lecture_question',
    MANUAL: 'manual',
    AUTO: 'auto',
  },

  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists with this email',
    USER_NOT_FOUND: 'User not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Resource not found',
    INTERNAL_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
  },
};
