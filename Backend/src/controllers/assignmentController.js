/**
 * Assignment Controller V2 - Refactored to use Service Layer
 * Uses assignmentService for all business logic
 * Handles HTTP requests and responses
 */

const assignmentService = require('../services/assignmentService');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHandler');

/**
 * @desc    Create a new assignment
 * @route   POST /api/assignments
 * @access  Private (Teacher/Admin)
 */
exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate, maxMarks, submissionType, rubric, allowLateSubmission, latePenalty } = req.body;

    // Validate required fields
    if (!courseId || !title || !dueDate || !maxMarks) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required fields: courseId, title, dueDate, maxMarks')
      );
    }

    const assignment = await assignmentService.createAssignment(
      {
        courseId,
        title,
        description,
        dueDate,
        maxMarks,
        submissionType: submissionType || 'pdf',
        rubric,
        allowLateSubmission: allowLateSubmission !== false,
        latePenalty: latePenalty || 10,
      },
      req.user._id
    );

    return res.status(201).json(
      createSuccessResponse(201, 'Assignment created successfully', assignment)
    );
  } catch (error) {
    console.error('Create Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to create assignment')
    );
  }
};

/**
 * @desc    Get assignment by ID
 * @route   GET /api/assignments/:assignmentId
 * @access  Private (Teacher/Student)
 */
exports.getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await assignmentService.getAssignmentById(assignmentId);

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment retrieved successfully', assignment)
    );
  } catch (error) {
    console.error('Get Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get assignment')
    );
  }
};

/**
 * @desc    Get all assignments for a course
 * @route   GET /api/assignments/course/:courseId
 * @access  Private (Teacher)
 */
exports.getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { status };
    if (!status) delete query.status;

    const result = await assignmentService.getAssignmentsByCourse(
      courseId,
      { page: parseInt(page), limit: parseInt(limit), ...query }
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Assignments retrieved successfully', result.data, {
        pagination: result.pagination,
      })
    );
  } catch (error) {
    console.error('Get Assignments Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get assignments')
    );
  }
};

/**
 * @desc    Update assignment
 * @route   PUT /api/assignments/:assignmentId
 * @access  Private (Teacher - creator only)
 */
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, maxMarks, rubric, allowLateSubmission, latePenalty } = req.body;

    const updatedAssignment = await assignmentService.updateAssignment(
      assignmentId,
      {
        title,
        description,
        dueDate,
        maxMarks,
        rubric,
        allowLateSubmission,
        latePenalty,
      },
      req.user._id
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment updated successfully', updatedAssignment)
    );
  } catch (error) {
    console.error('Update Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to update assignment')
    );
  }
};

/**
 * @desc    Delete assignment
 * @route   DELETE /api/assignments/:assignmentId
 * @access  Private (Teacher - creator only)
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await assignmentService.deleteAssignment(assignmentId, req.user._id);

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment deleted successfully', {})
    );
  } catch (error) {
    console.error('Delete Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to delete assignment')
    );
  }
};

/**
 * @desc    Publish assignment (make visible to students)
 * @route   POST /api/assignments/:assignmentId/publish
 * @access  Private (Teacher - creator only)
 */
exports.publishAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await assignmentService.publishAssignment(assignmentId, req.user._id);

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment published successfully', assignment)
    );
  } catch (error) {
    console.error('Publish Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to publish assignment')
    );
  }
};

/**
 * @desc    Close assignment (disable submissions)
 * @route   POST /api/assignments/:assignmentId/close
 * @access  Private (Teacher - creator only)
 */
exports.closeAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await assignmentService.closeAssignment(assignmentId, req.user._id);

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment closed successfully', assignment)
    );
  } catch (error) {
    console.error('Close Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to close assignment')
    );
  }
};

/**
 * @desc    Submit assignment (Student)
 * @route   POST /api/assignments/:assignmentId/submit
 * @access  Private (Student)
 */
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required field: courseId')
      );
    }

    if (!req.file) {
      return res.status(400).json(
        createErrorResponse(400, 'No file uploaded. Please attach a file.')
      );
    }

    const submission = await assignmentService.submitAssignment(
      assignmentId,
      req.user._id,
      courseId,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
      }
    );

    return res.status(201).json(
      createSuccessResponse(201, 'Assignment submitted successfully', submission)
    );
  } catch (error) {
    console.error('Submit Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to submit assignment')
    );
  }
};

/**
 * @desc    Get student's own submission
 * @route   GET /api/assignments/:assignmentId/my-submission
 * @access  Private (Student)
 */
exports.getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { courseId } = req.query;

    if (!courseId) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required query parameter: courseId')
      );
    }

    const submission = await assignmentService.getStudentSubmission(
      assignmentId,
      req.user._id,
      courseId
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Submission retrieved successfully', submission)
    );
  } catch (error) {
    console.error('Get Submission Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get submission')
    );
  }
};

/**
 * @desc    Resubmit assignment
 * @route   POST /api/assignments/:assignmentId/resubmit
 * @access  Private (Student)
 */
exports.resubmitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required field: courseId')
      );
    }

    if (!req.file) {
      return res.status(400).json(
        createErrorResponse(400, 'No file uploaded. Please attach a file.')
      );
    }

    const submission = await assignmentService.resubmitAssignment(
      assignmentId,
      req.user._id,
      courseId,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype,
      }
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Assignment resubmitted successfully', submission)
    );
  } catch (error) {
    console.error('Resubmit Assignment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to resubmit assignment')
    );
  }
};

/**
 * @desc    Get all submissions for an assignment (Teacher view)
 * @route   GET /api/assignments/:assignmentId/submissions
 * @access  Private (Teacher - creator only)
 */
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { status };
    if (!status) delete query.status;

    const result = await assignmentService.getAssignmentSubmissions(
      assignmentId,
      req.user._id,
      { page: parseInt(page), limit: parseInt(limit), ...query }
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Submissions retrieved successfully', result.data, {
        pagination: result.pagination,
      })
    );
  } catch (error) {
    console.error('Get Submissions Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get submissions')
    );
  }
};

/**
 * @desc    Grade a submission
 * @route   POST /api/submissions/:submissionId/grade
 * @access  Private (Teacher - creator of assignment only)
 */
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    if (marks === undefined) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required field: marks')
      );
    }

    const submission = await assignmentService.gradeSubmission(
      submissionId,
      {
        marks,
        feedback,
      },
      req.user._id
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Submission graded successfully', submission)
    );
  } catch (error) {
    console.error('Grade Submission Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to grade submission')
    );
  }
};

/**
 * @desc    Add comment to submission
 * @route   POST /api/submissions/:submissionId/comment
 * @access  Private (Teacher)
 */
exports.addComment = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json(
        createErrorResponse(400, 'Missing required field: comment')
      );
    }

    const submission = await assignmentService.addComment(
      submissionId,
      comment,
      req.user._id
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Comment added successfully', submission)
    );
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to add comment')
    );
  }
};

/**
 * @desc    Get assignment analytics
 * @route   GET /api/assignments/:assignmentId/analytics
 * @access  Private (Teacher - creator only)
 */
exports.getAssignmentAnalytics = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const analytics = await assignmentService.getAssignmentAnalytics(
      assignmentId,
      req.user._id
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Analytics retrieved successfully', analytics)
    );
  } catch (error) {
    console.error('Get Analytics Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get analytics')
    );
  }
};

/**
 * @desc    Get class-level analytics
 * @route   GET /api/courses/:courseId/assignments/analytics
 * @access  Private (Teacher - course owner only)
 */
exports.getClassAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const analytics = await assignmentService.getClassAnalytics(
      courseId,
      req.user._id
    );

    return res.status(200).json(
      createSuccessResponse(200, 'Class analytics retrieved successfully', analytics)
    );
  } catch (error) {
    console.error('Get Class Analytics Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get class analytics')
    );
  }
};

/**
 * @desc    Get pending submissions for teacher across all courses
 * @route   GET /api/assignments/teacher/:teacherId/pending
 * @access  Private (Teacher/Admin)
 */
exports.getPendingSubmissionsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const pendingSubmissions = await assignmentService.getPendingSubmissionsForTeacher(teacherId);

    return res.status(200).json(
      createSuccessResponse(200, 'Pending submissions retrieved successfully', pendingSubmissions)
    );
  } catch (error) {
    console.error('Get Pending Submissions Error:', error);
    return res.status(error.statusCode || 500).json(
      createErrorResponse(error.statusCode || 500, error.message || 'Failed to get pending submissions')
    );
  }
};

module.exports = exports;
