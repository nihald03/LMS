/**
 * Grade Controller - Grade Management
 * Handles all grade-related operations including retrieval, creation, and export
 */

const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

/**
 * Get all grades for a course
 * @route GET /api/grades/course/:courseId
 * @access Private (Teacher/Admin of that course)
 */
exports.getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found', [])
      );
    }

    // Verify authorization - Check if teacher teaches this course
    if (req.user.role === ROLES.TEACHER) {
      const isTeacher = req.user._id.toString() === course.assignedTeacher.toString();
      const isAdmin = req.user.role === ROLES.ADMIN;
      
      if (!isTeacher && !isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized', [])
        );
      }
    }

    // ✅ NEW: Calculate analytics from StudentResponse records (real-time)
    const StudentResponse = require('../models/StudentResponse');
    const Student = require('../models/Student');
    
    // Get all enrollments for the course
    const enrollments = await Enrollment.find({ courseId })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      });

    // For each student, calculate their scores from StudentResponse records
    const enrichedGrades = await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = enrollment.studentId;
        
        // Extract student name and email properly
        let studentName = 'Unknown';
        let studentEmail = 'Unknown';
        
        if (student && student.userId) {
          studentName = student.userId.name || 'Unknown';
          studentEmail = student.userId.email || 'Unknown';
        }
        
        // Get all student responses (quiz + assignment attempts)
        const studentResponses = await StudentResponse.find({
          studentId: student._id,
          courseId: courseId
        });

        // Calculate scores from actual responses
        const quizResponses = studentResponses.filter(sr => sr.responseType === 'quiz');
        const assignmentResponses = studentResponses.filter(sr => sr.responseType === 'assignment');

        // Calculate quiz score: percentage of marks earned vs total marks
        const quizScore = quizResponses.length > 0
          ? (quizResponses.reduce((sum, sr) => sum + (sr.marksAwarded || 0), 0) / 
             (quizResponses.reduce((sum, sr) => sum + (sr.totalMarks || 1), 0) || 1)) * 100
          : 0;

        // Calculate assignment score: percentage of marks earned vs total marks
        const assignmentScore = assignmentResponses.length > 0
          ? (assignmentResponses.reduce((sum, sr) => sum + (sr.marksAwarded || 0), 0) / 
             (assignmentResponses.reduce((sum, sr) => sum + (sr.totalMarks || 1), 0) || 1)) * 100
          : 0;

        // Calculate weighted final score
        const finalScore = (quizScore * 0.5) + (assignmentScore * 0.5);

        // Calculate letter grade
        let letterGrade = 'N/A';
        if (finalScore >= 90) letterGrade = 'A';
        else if (finalScore >= 80) letterGrade = 'B';
        else if (finalScore >= 70) letterGrade = 'C';
        else if (finalScore >= 60) letterGrade = 'D';
        else if (finalScore > 0) letterGrade = 'F';

        // Calculate GPA (4.0 scale)
        let gpa = 0;
        if (letterGrade === 'A') gpa = 4.0;
        else if (letterGrade === 'B') gpa = 3.0;
        else if (letterGrade === 'C') gpa = 2.0;
        else if (letterGrade === 'D') gpa = 1.0;
        else if (letterGrade === 'F') gpa = 0.0;

        return {
          _id: student._id,
          studentId: student._id,
          studentName: studentName,
          studentEmail: studentEmail,
          courseId: courseId,
          quizScore: parseFloat(quizScore.toFixed(2)),
          assignmentScore: parseFloat(assignmentScore.toFixed(2)),
          attendancePercentage: enrollment.attendancePercentage || 0,
          finalScore: parseFloat(finalScore.toFixed(2)),
          letterGrade: letterGrade,
          gpa: parseFloat(gpa.toFixed(2)),
          enrollmentStatus: enrollment.status || 'active',
          totalAttempts: studentResponses.length,
          quizAttempts: quizResponses.length,
          assignmentAttempts: assignmentResponses.length
        };
      })
    );

    // Calculate statistics
    const stats = {
      totalStudents: enrichedGrades.length,
      avgScore: enrichedGrades.length > 0
        ? (enrichedGrades.reduce((sum, g) => sum + (g.finalScore || 0), 0) / enrichedGrades.length).toFixed(2)
        : 0,
      passRate: enrichedGrades.length > 0
        ? ((enrichedGrades.filter(g => (g.finalScore || 0) >= 50).length / enrichedGrades.length) * 100).toFixed(1)
        : 0,
      distribution: {
        A: enrichedGrades.filter(g => g.letterGrade === 'A').length,
        B: enrichedGrades.filter(g => g.letterGrade === 'B').length,
        C: enrichedGrades.filter(g => g.letterGrade === 'C').length,
        D: enrichedGrades.filter(g => g.letterGrade === 'D').length,
        F: enrichedGrades.filter(g => g.letterGrade === 'F').length
      }
    };

    // Prevent caching for real-time data
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course grades retrieved', {
        courseId: course._id,
        courseName: course.courseName,
        grades: enrichedGrades,
        stats
      })
    );
  } catch (error) {
    console.error('Get course grades error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve grades',
        [error.message]
      )
    );
  }
};

/**
 * Export grades to CSV
 * @route GET /api/grades/course/:courseId/export
 * @access Private (Teacher/Admin of that course)
 */
exports.exportGradesToCSV = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found', [])
      );
    }

    // Verify authorization - Check if teacher teaches this course
    if (req.user.role === ROLES.TEACHER) {
      const isTeacher = req.user._id.toString() === course.assignedTeacher.toString();
      const isAdmin = req.user.role === ROLES.ADMIN;
      
      if (!isTeacher && !isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized', [])
        );
      }
    }

    // Get all grades for the course
    const grades = await Grade.find({ courseId })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    // Build CSV content
    let csv = 'Student Name,Email,Quiz Score,Assignment Score,Attendance %,Final Score,Letter Grade,GPA\n';

    grades.forEach(grade => {
      const studentName = grade.studentId?.userId?.name || 'Unknown';
      const studentEmail = grade.studentId?.userId?.email || 'Unknown';
      csv += `${studentName},${studentEmail},${grade.quizScore || 0},${grade.assignmentScore || 0},${grade.attendancePercentage || 0},${grade.finalScore || 0},${grade.letterGrade || 'N/A'},${grade.gpa || 0}\n`;
    });

    // Send as file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="grades_${courseId}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export grades error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to export grades',
        [error.message]
      )
    );
  }
};

/**
 * Get student's grades across all courses
 * @route GET /api/grades/student/:studentId
 * @access Private (Student viewing own, or Teacher/Admin)
 */
exports.getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify authorization
    if (req.user.role === ROLES.STUDENT && req.user._id.toString() !== studentId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized', [])
      );
    }

    // Get student
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student not found', [])
      );
    }

    // Get all grades for the student
    const grades = await Grade.find({ studentId })
      .populate({
        path: 'courseId',
        select: 'courseName'
      })
      .sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Student grades retrieved', {
        studentId: student._id,
        studentName: student.userId.name,
        studentEmail: student.userId.email,
        grades: grades.map(g => ({
          _id: g._id,
          courseId: g.courseId._id,
          courseName: g.courseId.courseName,
          quizScore: g.quizScore || 0,
          assignmentScore: g.assignmentScore || 0,
          attendancePercentage: g.attendancePercentage || 0,
          finalScore: g.finalScore || 0,
          letterGrade: g.letterGrade || 'N/A',
          gpa: g.gpa || 0,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        }))
      })
    );
  } catch (error) {
    console.error('Get student grades error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve student grades',
        [error.message]
      )
    );
  }
};

/**
 * Get specific grade record
 * @route GET /api/grades/:gradeId
 * @access Private
 */
exports.getGradeById = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const grade = await Grade.findById(gradeId)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('courseId', 'courseName');

    if (!grade) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Grade not found', [])
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Grade retrieved', grade)
    );
  } catch (error) {
    console.error('Get grade error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve grade',
        [error.message]
      )
    );
  }
};

/**
 * Create or update grade
 * @route POST /api/grades
 * @access Private (Teacher/Admin)
 */
exports.createOrUpdateGrade = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      quizScore,
      assignmentScore,
      attendancePercentage,
      finalScore,
      letterGrade,
      gpa
    } = req.body;

    // Validation
    if (!studentId || !courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Student ID and Course ID are required', [])
      );
    }

    // Verify authorization
    if (req.user.role === ROLES.TEACHER) {
      const course = await Course.findById(courseId);
      
      if (!course) {
        return res.status(HTTP_STATUS.NOT_FOUND).json(
          createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found', [])
        );
      }
      
      const isTeacher = req.user._id.toString() === course.assignedTeacher.toString();
      const isAdmin = req.user.role === ROLES.ADMIN;
      
      if (!isTeacher && !isAdmin) {
        return res.status(HTTP_STATUS.FORBIDDEN).json(
          createErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized', [])
        );
      }
    }

    // Find or create grade
    let grade = await Grade.findOne({ studentId, courseId });

    if (grade) {
      // Update existing
      grade.quizScore = quizScore !== undefined ? quizScore : grade.quizScore;
      grade.assignmentScore = assignmentScore !== undefined ? assignmentScore : grade.assignmentScore;
      grade.attendancePercentage = attendancePercentage !== undefined ? attendancePercentage : grade.attendancePercentage;
      grade.finalScore = finalScore !== undefined ? finalScore : grade.finalScore;
      grade.letterGrade = letterGrade !== undefined ? letterGrade : grade.letterGrade;
      grade.gpa = gpa !== undefined ? gpa : grade.gpa;
    } else {
      // Create new
      grade = new Grade({
        studentId,
        courseId,
        quizScore: quizScore || 0,
        assignmentScore: assignmentScore || 0,
        attendancePercentage: attendancePercentage || 0,
        finalScore: finalScore || 0,
        letterGrade: letterGrade || 'N/A',
        gpa: gpa || 0
      });
    }

    await grade.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Grade saved successfully', grade)
    );
  } catch (error) {
    console.error('Create or update grade error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to save grade',
        [error.message]
      )
    );
  }
};
