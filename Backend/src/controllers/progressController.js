const progressService = require('../services/progressService');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

/**
 * Get course progress for a student
 * @route GET /api/progress/courses/:courseId/progress
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Always get student from logged-in user
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const enrollment = await Enrollment.findOne({
      studentId: student._id,
      courseId,
      status: { $in: ['active', 'completed','dropped'] },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found for this course',
      });
    }

    const progress = await progressService.calculateCourseProgress(
      enrollment._id
    );

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error calculating course progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate course progress',
      error: error.message,
    });
  }
};


/**
 * Get student dashboard data
 * @route GET /api/progress/students/:studentId/dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const dashboard = await progressService.getStudentDashboard(student._id);

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard',
      error: error.message,
    });
  }
};


/**
 * Get student grades for all courses
 * @route GET /api/progress/students/:studentId/grades
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    // ✅ Students can ONLY see their own grades
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });

      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these grades',
        });
      }
    }

    // ✅ Reuse transcript logic to get all course grades
    const transcript = await progressService.getStudentTranscript(studentId);

    res.status(200).json({
      success: true,
      data: transcript.transcript,
    });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student grades',
      error: error.message,
    });
  }
};

/**
 * Get grade details for a specific course
 * @route GET /api/progress/courses/:courseId/grades/:studentId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCourseGradeDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Always get student from logged-in user
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

   const enrollment = await Enrollment.findOne({
  studentId: student._id,
  courseId,
  status: { $in: ['active', 'completed'] },
});

const gradeDetails = await progressService.calculateCourseGrade(
  enrollment._id,
  courseId
);
    res.status(200).json({
      success: true,
      data: gradeDetails,
    });
  } catch (error) {
    console.error('Error fetching grade details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grade details',
      error: error.message,
    });
  }
};


/**
 * Get student transcript
 * @route GET /api/progress/students/:studentId/transcript
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getStudentTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;

    // ✅ Students can view ONLY their own transcript
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });

      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this transcript',
        });
      }
    }

    const transcript = await progressService.getStudentTranscript(studentId);

    res.status(200).json({
      success: true,
      data: transcript,
    });
  } catch (error) {
    console.error('Error generating transcript:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate transcript',
      error: error.message,
    });
  }
};
/**
 * Get student attendance summary
 * @route GET /api/progress/students/:studentId/attendance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // ✅ Student can view ONLY their own attendance
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });

      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this attendance',
        });
      }
    }

    const attendance = await progressService.getStudentAttendance(studentId);

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Error calculating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate attendance',
      error: error.message,
    });
  }
};

/**
 * Get progress report for a specific course
 * @route GET /api/progress/courses/:courseId/progress-report/:studentId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProgressReport = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // ✅ Student can view ONLY their own progress report
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });

      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this report',
        });
      }
    }

    const progressReport = await progressService.generateProgressReport(
      studentId,
      courseId
    );

    res.status(200).json({
      success: true,
      data: progressReport,
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate progress report',
      error: error.message,
    });
  }
};

/**
 * Get class progress summary (for teachers/admins)
 * @route GET /api/progress/courses/:courseId/class-progress-summary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClassProgressSummary = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check authorization - only teachers and admins can view class summary
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view class progress summary',
      });
    }

    const classSummary = await progressService.generateClassProgressSummary(
      courseId
    );

    res.status(200).json({
      success: true,
      data: classSummary,
    });
  } catch (error) {
    console.error('Error generating class progress summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate class progress summary',
      error: error.message,
    });
  }
};

/**
 * Get aggregated course grade for a student (by enrollment)
 * @route GET /api/progress/:enrollmentId/grade
 */
exports.getStudentCourseGrade = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    // Fetch enrollment
    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // ✅ Students can only view their own grades
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });

      if (!student || enrollment.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this grade',
        });
      }
    }

    // Calculate aggregated grade
    const grade = await progressService.calculateCourseGrade(
      enrollment._id,
      enrollment.courseId
    );

    return res.status(200).json({
      success: true,
      data: grade,
    });
  } catch (error) {
    console.error('Error fetching aggregated course grade:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course grade',
      error: error.message,
    });
  }
};