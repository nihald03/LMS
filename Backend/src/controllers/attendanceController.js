/**
 * Attendance Controller
 * 
 * Handles:
 * - Student viewing their attendance breakdown
 * - Teacher viewing course-wide attendance analytics
 * - Teacher viewing defaulter list
 * - Admin unrestricted access to all data
 * - Configuration management
 */

const AttendanceService = require('../services/attendanceService');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceConfig = require('../models/AttendanceConfig');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHandler');

// ===================== STUDENT ENDPOINTS =====================

/**
 * GET /api/attendance/:enrollmentId/breakdown
 * Student views their attendance breakdown for a specific course
 */
exports.getStudentAttendanceBreakdown = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    // Get enrollment
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('studentId')
      .populate('courseId');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Enrollment not found')
      );
    }

// Authorization: Students can only see their own data
if (req.user.role === ROLES.STUDENT) {
  const student = await Student.findOne({ userId: req.user._id });

  if (!student) {
    return res.status(HTTP_STATUS.NOT_FOUND).json(
      createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found')
    );
  }

  if (enrollment.studentId._id.toString() !== student._id.toString()) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized to view this data')
    );
  }
}


    // Get breakdown
    const breakdown = await AttendanceService.getAttendanceBreakdown(enrollmentId);

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Attendance breakdown retrieved', breakdown)
    );
  } catch (error) {
    console.error('Error in getStudentAttendanceBreakdown:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

/**
 * GET /api/attendance/student/courses
 * Student views attendance for all their enrolled courses
 */
exports.getStudentCourseAttendance = async (req, res) => {
  try {
    // Get all enrollments for the logged-in student
    const enrollments = await Enrollment.find({
      studentId: req.user._id,
    })
      .populate('courseId')
      .sort({ enrollmentDate: -1 });

    // Get attendance breakdown for each enrollment
    const attendanceData = await Promise.all(
      enrollments.map((enrollment) =>
        AttendanceService.getAttendanceBreakdown(enrollment._id)
      )
    );

    // Filter only valid attendance records
    const validAttendances = attendanceData.filter(
      (a) => typeof a?.overall?.percentage === 'number'
    );

    // Calculate safe average (never null)
    const averageAttendance =
      validAttendances.length === 0
        ? 0
        : Math.round(
            (validAttendances.reduce(
              (sum, a) => sum + a.overall.percentage,
              0
            ) /
              validAttendances.length) *
              100
          ) / 100;

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(
        HTTP_STATUS.OK,
        'Student attendance across courses retrieved',
        {
          totalCourses: attendanceData.length,
          courses: attendanceData,
          summary: {
            average: averageAttendance,
            defaulterIn: validAttendances
              .filter((a) => a.overall.isDefaulter)
              .map((a) => a.courseName),
          },
        }
      )
    );
  } catch (error) {
    console.error('Error in getStudentCourseAttendance:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.message
      )
    );
  }
};


// ===================== TEACHER ENDPOINTS =====================

/**
 * GET /api/attendance/courses/:courseId/analytics
 * Teacher views attendance analytics for their course
 */
exports.getCourseAttendanceAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course and verify teacher owns it
const course = await Course.findById(courseId).populate('assignedTeacher');

// Course must exist first
if (!course) {
  return res.status(HTTP_STATUS.NOT_FOUND).json(
    createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
  );
}

// Authorization check FIRST
if (req.user.role === ROLES.TEACHER) {
  const isTeacher = req.user._id.toString() === course.assignedTeacher.toString();
  
  if (!isTeacher) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Not authorized to view this course'
      )
    );
  }
}

    // Get analytics
    const analytics = await AttendanceService.getCourseAttendanceAnalytics(courseId);

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(
        HTTP_STATUS.OK,
        'Course attendance analytics retrieved',
        analytics
      )
    );
  } catch (error) {
    console.error('Error in getCourseAttendanceAnalytics:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

/**
 * GET /api/attendance/courses/:courseId/defaulters
 * Teacher views defaulter list for their course
 * Filters: semester, department, attendance threshold
 */
exports.getCourseDefaulterList = async (req, res) => {
  try {
    const { courseId } = req.query;
    const { threshold, semester, department } = req.query;

    // If courseId not in query, use from param
    const actualCourseId = courseId || req.params.courseId;

    // Get course and verify authorization
    const course = await Course.findById(actualCourseId).populate('assignedTeacher');

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
      );
    }

    // Authorization
    if (req.user.role === ROLES.TEACHER) {
      const isTeacher = req.user._id.toString() === course.assignedTeacher.toString();
      if (!isTeacher) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized to view this course')
        );
      }
    }

    // Get config for threshold
    const config = await AttendanceConfig.findOne({ courseId: actualCourseId });
    const attendanceThreshold = parseFloat(threshold) || config?.defaulterThreshold || 75;

    // Get enrollments with low attendance
    let query = { courseId: actualCourseId, attendancePercentage: { $lt: attendanceThreshold } };

    if (semester) {
      query.semester = parseInt(semester);
    }

    const defaulters = await Enrollment.find(query)
      .populate('studentId')
      .sort({ attendancePercentage: 1 });

    // Format response with detailed info
    const defaulterList = await Promise.all(
      defaulters.map(async (enrollment) => {
        const breakdown = await AttendanceService.getAttendanceBreakdown(enrollment._id);
        return {
          enrollmentId: enrollment._id,
          studentId: enrollment.studentId._id,
          studentName: enrollment.studentId.firstName + ' ' + enrollment.studentId.lastName,
          email: enrollment.studentId.email,
          enrollmentDate: enrollment.enrollmentDate,
          overallAttendance: enrollment.attendancePercentage,
          status: enrollment.status,
          breakdown: breakdown.bySource,
          riskLevel: this.calculateRiskLevel(enrollment.attendancePercentage),
        };
      })
    );

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Defaulter list retrieved', {
        courseId: actualCourseId,
        courseName: course.courseName,
        threshold: attendanceThreshold,
        totalDefaulters: defaulterList.length,
        totalEnrolled: (await Enrollment.countDocuments({ courseId: actualCourseId })),
        defaulterPercentage: Math.round(
          (defaulterList.length /
            (await Enrollment.countDocuments({ courseId: actualCourseId }))) *
            100 * 100
        ) / 100,
        defaulters: defaulterList,
        exportReady: {
          format: 'JSON/CSV',
          timestamp: new Date(),
        },
      })
    );
  } catch (error) {
    console.error('Error in getCourseDefaulterList:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

/**
 * GET /api/attendance/defaulters
 * Admin views defaulters across all courses
 * Filters: courseId, semester, department, threshold
 */
exports.getAllDefaulters = async (req, res) => {
  try {
    const { courseId, semester, threshold, department } = req.query;

    // Build query
    let enrollmentQuery = { attendancePercentage: { $lt: threshold || 75 } };

    if (courseId) {
      enrollmentQuery.courseId = courseId;
    }

    if (semester) {
      enrollmentQuery.semester = parseInt(semester);
    }

    // Get all defaulters
    const defaulters = await Enrollment.find(enrollmentQuery)
      .populate('studentId')
      .populate('courseId')
      .sort({ attendancePercentage: 1 });

    // Format with detailed info
    const defaulterList = await Promise.all(
      defaulters.map(async (enrollment) => {
        const breakdown = await AttendanceService.getAttendanceBreakdown(enrollment._id);
        return {
          enrollmentId: enrollment._id,
          studentId: enrollment.studentId._id,
          studentName: enrollment.studentId.firstName + ' ' + enrollment.studentId.lastName,
          email: enrollment.studentId.email,
          courseId: enrollment.courseId._id,
          courseName: enrollment.courseId.courseName,
          courseCode: enrollment.courseCode || 'N/A',
          overallAttendance: enrollment.attendancePercentage,
          status: enrollment.status,
          breakdown: breakdown.bySource,
          riskLevel: this.calculateRiskLevel(enrollment.attendancePercentage),
        };
      })
    );

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Global defaulter list retrieved', {
        totalDefaulters: defaulterList.length,
        threshold: threshold || 75,
        filters: {
          courseId: courseId || 'All',
          semester: semester || 'All',
          department: department || 'All',
        },
        defaulters: defaulterList,
        exportReady: {
          format: 'JSON/CSV',
          timestamp: new Date(),
        },
      })
    );
  } catch (error) {
    console.error('Error in getAllDefaulters:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// ===================== ADMIN ENDPOINTS =====================

/**
 * GET /api/attendance/config/:courseId
 * Get attendance configuration for a course
 */
exports.getAttendanceConfig = async (req, res) => {
  try {
    const { courseId } = req.params;

    let config = await AttendanceConfig.findOne({ courseId });

    if (!config) {
      // Create default config
      config = await AttendanceConfig.create({
        courseId,
        weights: {
          lecture: 33.33,
          quiz: 33.33,
          assignment: 33.34,
        },
      });
    }

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Attendance config retrieved', config)
    );
  } catch (error) {
    console.error('Error in getAttendanceConfig:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

/**
 * PUT /api/attendance/config/:courseId
 * Update attendance configuration for a course
 */
exports.updateAttendanceConfig = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { weights, calculationMethod, defaulterThreshold, includeLectures, includeQuizzes, includeAssignments } = req.body;

    // Validate weights sum to 100
    if (weights) {
      const sum = weights.lecture + weights.quiz + weights.assignment;
      if (Math.abs(sum - 100) > 1) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Weights must sum to 100')
        );
      }
    }

    const config = await AttendanceConfig.findOneAndUpdate(
      { courseId },
      {
        ...(weights && { weights }),
        ...(calculationMethod && { calculationMethod }),
        ...(defaulterThreshold && { defaulterThreshold }),
        ...(includeLectures !== undefined && { includeLectures }),
        ...(includeQuizzes !== undefined && { includeQuizzes }),
        ...(includeAssignments !== undefined && { includeAssignments }),
      },
      { new: true, upsert: true }
    );

    // Recalculate all enrollments for this course
    const enrollments = await Enrollment.find({ courseId });
    await Promise.all(
      enrollments.map((enrollment) =>
        AttendanceService.recalculateEnrollmentAttendance(enrollment._id, courseId)
      )
    );

    res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Attendance config updated and recalculated', config)
    );
  } catch (error) {
    console.error('Error in updateAttendanceConfig:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

/**
 * Helper: Calculate risk level based on attendance
 */
exports.calculateRiskLevel = function(attendance) {
  if (attendance >= 90) return 'LOW';
  if (attendance >= 75) return 'MEDIUM';
  if (attendance >= 50) return 'HIGH';
  return 'CRITICAL';
};

module.exports = exports;
