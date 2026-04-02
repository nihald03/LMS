/**
 * Assignment Service - Business Logic Layer
 * Handles all assignment-related operations, validations, and database queries
 */

const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

class AssignmentService {
  /**
   * Create a new assignment
   */
  async createAssignment(assignmentData, teacherId) {
    try {
      // Verify course exists
      const course = await Course.findById(assignmentData.courseId);
      if (!course) {
        const error = new Error('Course not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify teacher has access to this course
      if (course.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to create assignments for this course');
        error.statusCode = 403;
        throw error;
      }

      const assignment = new Assignment({
        ...assignmentData,
        createdBy: teacherId,
        status: 'draft',
      });

      await assignment.save();
      return assignment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get assignment by ID
   */
async getAssignmentById(assignmentId, user) {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate('courseId', 'title courseName createdBy')
      .populate('createdBy', 'firstName lastName email');

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

// ✅ TEACHER / ADMIN → check ownership
if (user.role === 'teacher' || user.role === 'admin') {

  // ✅ SAFE extraction (handles null + populated/unpopulated)
  const createdById =
    assignment.createdBy?._id?.toString() ||
    assignment.createdBy?.toString();

  console.log("DEBUG MATCH CHECK:", {
    assignmentCreatedBy: createdById,
    currentUser: user._id.toString(),
    role: user.role
  });

  // ❗ Handle missing creator (DB issue)
  if (!createdById) {
    const error = new Error('Assignment creator not found');
    error.statusCode = 500;
    throw error;
  }

  // ✅ Ownership check
  if (createdById !== user._id.toString()) {
    const error = new Error('You do not have permission to view this assignment');
    error.statusCode = 403;
    throw error;
  }

  return assignment;
}

    // ✅ STUDENT → check enrollment
    const enrollment = await Enrollment.findOne({
      courseId: assignment.courseId._id,
      studentId: user._id,
      status: { $in: ['active', 'completed'] }
    });

    if (!enrollment) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    return assignment;

  } catch (error) {
    throw error;
  }
}

  /**
   * Get all assignments for a course with pagination
   */
  async getAssignmentsByCourse(courseId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const query = { courseId };
      if (status) {
        query.status = status;
      }

      const assignments = await Assignment.find(query)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 });

      const total = await Assignment.countDocuments(query);

      return {
        data: assignments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(assignmentId, updateData, teacherId) {
    try {
      const assignment = await Assignment.findById(assignmentId)
  .populate('studentId', 'firstName lastName email')
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify teacher ownership
      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to update this assignment');
        error.statusCode = 403;
        throw error;
      }

      // Update only provided fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          assignment[key] = updateData[key];
        }
      });

      assignment.updatedAt = new Date();
      await assignment.save();

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId, teacherId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify teacher ownership
      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to delete this assignment');
        error.statusCode = 403;
        throw error;
      }

      await Assignment.findByIdAndDelete(assignmentId);
      return { message: 'Assignment deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Publish assignment (make visible to students)
   */
  async publishAssignment(assignmentId, teacherId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to publish this assignment');
        error.statusCode = 403;
        throw error;
      }

      assignment.status = 'published';
      assignment.publishedAt = new Date();
      await assignment.save();

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Close assignment (disable submissions)
   */
  async closeAssignment(assignmentId, teacherId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to close this assignment');
        error.statusCode = 403;
        throw error;
      }

      assignment.status = 'closed';
      assignment.closedAt = new Date();
      await assignment.save();

      return assignment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit assignment
   */
  async submitAssignment(assignmentId, studentId, courseId, fileData) {
    try {
      console.log("🔍 SUBMISSION DEBUG:", { 
        assignmentId, 
        studentId, 
        courseId,
        studentIdType: typeof studentId,
        courseIdType: typeof courseId,
        studentIdValue: studentId?.toString?.() || studentId,
        courseIdValue: courseId?.toString?.() || courseId
      });

      // Validate IDs before conversion
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        const error = new Error("Invalid courseId provided");
        error.statusCode = 400;
        throw error;
      }

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        const error = new Error("Invalid studentId provided");
        error.statusCode = 400;
        throw error;
      }

      // Convert string IDs to ObjectId
      const courseIdObj = new mongoose.Types.ObjectId(courseId);
      const studentIdObj = new mongoose.Types.ObjectId(studentId);

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.status !== 'published') {
        const error = new Error('This assignment is not available for submission');
        error.statusCode = 400;
        throw error;
      }

      // Verify student is enrolled in the course with status validation
      const enrollment = await Enrollment.findOne({
        courseId: courseIdObj,
        studentId: studentIdObj,
        status: { $in: ['active', 'completed'] }
      });

      console.log("✅ ENROLLMENT CHECK:", { 
        studentId: studentIdObj.toString(), 
        courseId: courseIdObj.toString(),
        enrollmentFound: !!enrollment,
        enrollmentId: enrollment?._id,
        enrollmentStatus: enrollment?.status
      });

      if (!enrollment) {
        const error = new Error('You are not enrolled in this course');
        error.statusCode = 403;
        throw error;
      }

      // Check if already submitted
      const existingSubmission = await AssignmentSubmission.findOne({
        assignmentId,
        studentId: studentIdObj,
        courseId: courseIdObj,
      });
      if (existingSubmission && existingSubmission.status !== 'resubmitted') {
        const error = new Error('You have already submitted this assignment');
        error.statusCode = 400;
        throw error;
      }

      const isLate = new Date() > new Date(assignment.dueDate);

      const submission = new AssignmentSubmission({
        assignmentId,
        studentId: studentIdObj,
        courseId: courseIdObj,
        submissionFile: {
          url: `/api/uploads/assignments/${fileData.filename}`,
          filename: fileData.filename,
          fileSize: fileData.size,
          mimeType: fileData.mimeType,
        },
        submittedAt: new Date(),
        isLate,
        status: 'submitted',
      });

      await submission.save();
      console.log("✅ SUBMISSION SAVED:", { 
        submissionId: submission._id, 
        studentId: studentIdObj.toString(), 
        assignmentId,
        courseId: courseIdObj.toString()
      });
          const activityLogService = require('./activityLogService');

try {
  await activityLogService.logActivity({
    studentId: studentIdObj,
    courseId: courseIdObj,
    activityType: 'assignment_submit',
    activityData: {
      assignmentId,
      submissionId: submission._id,
      fileName: submission.submissionFile.filename,
      isLate: submission.isLate,
    }
  });

  console.log("✅ ASSIGNMENT ACTIVITY LOG CREATED");
} catch (err) {
  console.error("❌ ASSIGNMENT LOG ERROR:", err.message);
}
      return submission;
    } catch (error) {
      console.error("❌ SUBMISSION ERROR:", { 
        message: error.message, 
        statusCode: error.statusCode,
        studentId,
        courseId 
      });
      throw error;
    }

  }

  /**
   * Get student's submission
   */
  async getStudentSubmission(assignmentId, studentId, courseId) {
    try {
      const submission = await AssignmentSubmission.findOne({
        assignmentId,
        studentId,
        courseId,
      }).populate('studentId', 'firstName lastName email');

      if (!submission) {
        const error = new Error('No submission found for this assignment');
        error.statusCode = 404;
        throw error;
      }

      return submission;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resubmit assignment
   */
  async resubmitAssignment(assignmentId, studentId, courseId, fileData) {
    try {
      console.log("🔍 RESUBMISSION DEBUG:", { 
        assignmentId, 
        studentId, 
        courseId,
        studentIdType: typeof studentId,
        courseIdType: typeof courseId
      });

      // Validate IDs before conversion
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        const error = new Error("Invalid courseId provided");
        error.statusCode = 400;
        throw error;
      }

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        const error = new Error("Invalid studentId provided");
        error.statusCode = 400;
        throw error;
      }

      // Convert string IDs to ObjectId
      const courseIdObj = new mongoose.Types.ObjectId(courseId);
      const studentIdObj = new mongoose.Types.ObjectId(studentId);

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      // Verify enrollment status is still active/completed
      const enrollment = await Enrollment.findOne({
        courseId: courseIdObj,
        studentId: studentIdObj,
        status: { $in: ['active', 'completed'] }
      });

      console.log("✅ ENROLLMENT CHECK (RESUBMIT):", { 
        studentId: studentIdObj.toString(), 
        courseId: courseIdObj.toString(),
        enrollmentFound: !!enrollment,
        enrollmentStatus: enrollment?.status
      });

      if (!enrollment) {
        const error = new Error('You are not enrolled in this course');
        error.statusCode = 403;
        throw error;
      }

      if (!assignment.allowLateSubmission) {
        const isLate = new Date() > new Date(assignment.dueDate);
        if (isLate) {
          const error = new Error('Late submissions are not allowed for this assignment');
          error.statusCode = 400;
          throw error;
        }
      }

      let submission = await AssignmentSubmission.findOne({
        assignmentId,
        studentId: studentIdObj,
        courseId: courseIdObj,
      });

      if (!submission) {
        const error = new Error('No previous submission found');
        error.statusCode = 404;
        throw error;
      }

      submission.submissionFile = {
        url: `/api/uploads/assignments/${fileData.filename}`,
        filename: fileData.filename,
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
      };
      submission.submittedAt = new Date();
      submission.status = 'resubmitted';
      submission.isLate = new Date() > new Date(assignment.dueDate);

      await submission.save();
      console.log("✅ RESUBMISSION SAVED:", { 
        submissionId: submission._id, 
        studentId: studentIdObj.toString(), 
        assignmentId,
        courseId: courseIdObj.toString()
      });
      return submission;
    } catch (error) {
      console.error("❌ RESUBMISSION ERROR:", { 
        message: error.message, 
        statusCode: error.statusCode,
        studentId,
        courseId 
      });
      throw error;
    }
  }

  /**
   * Get all submissions for an assignment
   */
  async getAssignmentSubmissions(assignmentId, teacherId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to view submissions');
        error.statusCode = 403;
        throw error;
      }

      const query = { assignmentId };
      if (status) {
        query.status = status;
      }

      const submissions = await AssignmentSubmission.find(query)
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'firstName lastName email')
        .sort({ submittedAt: -1 });

      const total = await AssignmentSubmission.countDocuments(query);

      return {
        data: submissions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Grade a submission
   */
  async gradeSubmission(submissionId, gradeData, teacherId) {
    try {
      const submission = await AssignmentSubmission.findById(submissionId);
      if (!submission) {
        const error = new Error('Submission not found');
        error.statusCode = 404;
        throw error;
      }

      const assignment = await Assignment.findById(submission.assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to grade this submission');
        error.statusCode = 403;
        throw error;
      }

      if (gradeData.marks > assignment.maxMarks) {
        const error = new Error(`Marks cannot exceed ${assignment.maxMarks}`);
        error.statusCode = 400;
        throw error;
      }

      submission.marks = gradeData.marks;
      submission.feedback = gradeData.feedback || '';
      submission.gradedAt = new Date();
      submission.gradedBy = teacherId;
      submission.status = 'graded';

      await submission.save();
      return submission;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add comment to submission
   */
  async addComment(submissionId, comment, teacherId) {
    try {
      const submission = await AssignmentSubmission.findById(submissionId);
      if (!submission) {
        const error = new Error('Submission not found');
        error.statusCode = 404;
        throw error;
      }

      const assignment = await Assignment.findById(submission.assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to add comments');
        error.statusCode = 403;
        throw error;
      }

      if (!submission.comments) {
        submission.comments = [];
      }

      submission.comments.push({
        addedBy: teacherId,
        text: comment,
        createdAt: new Date(),
      });

      await submission.save();
      return submission;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get assignment analytics
   */
  async getAssignmentAnalytics(assignmentId, teacherId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (assignment.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to view analytics');
        error.statusCode = 403;
        throw error;
      }

      const submissions = await AssignmentSubmission.find({ assignmentId });
      const graded = submissions.filter((s) => s.status === 'graded');

      let averageMarks = 0;
      if (graded.length > 0) {
        const totalMarks = graded.reduce((sum, s) => sum + s.marks, 0);
        averageMarks = (totalMarks / graded.length).toFixed(2);
      }

      const submissionRate =
        submissions.length > 0
          ? ((submissions.length / (await Enrollment.countDocuments({ courseId: assignment.courseId }))) * 100).toFixed(2)
          : 0;

      return {
        totalSubmissions: submissions.length,
        gradedSubmissions: graded.length,
        pendingSubmissions: submissions.filter((s) => s.status === 'submitted').length,
        averageMarks,
        submissionRate: `${submissionRate}%`,
        lateSubmissions: submissions.filter((s) => s.isLate).length,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get class-level analytics
   */
  async getClassAnalytics(courseId, teacherId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        const error = new Error('Course not found');
        error.statusCode = 404;
        throw error;
      }

      if (course.createdBy.toString() !== teacherId.toString()) {
        const error = new Error('You do not have permission to view class analytics');
        error.statusCode = 403;
        throw error;
      }

      const assignments = await Assignment.find({ courseId });
      const enrollments = await Enrollment.find({ courseId });

      let totalSubmissions = 0;
      let totalGraded = 0;

      for (const assignment of assignments) {
        const submissions = await AssignmentSubmission.find({ assignmentId: assignment._id });
        totalSubmissions += submissions.length;
        totalGraded += submissions.filter((s) => s.status === 'graded').length;
      }

      return {
        courseId,
        totalAssignments: assignments.length,
        totalEnrolledStudents: enrollments.length,
        totalSubmissions,
        totalGraded,
        submissionRate:
          enrollments.length > 0
            ? `${((totalSubmissions / (assignments.length * enrollments.length)) * 100).toFixed(2)}%`
            : '0%',
        averageGradingRate:
          totalSubmissions > 0
            ? `${((totalGraded / totalSubmissions) * 100).toFixed(2)}%`
            : '0%',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending submissions for a teacher across all their courses
   */
  async getPendingSubmissionsForTeacher(teacherId) {
    try {
      // Get all courses taught by this teacher
      const courses = await Course.find({ createdBy: teacherId });
      const courseIds = courses.map((c) => c._id);

      if (courseIds.length === 0) {
        return [];
      }

      // Get all assignments for these courses
      const assignments = await Assignment.find({ courseId: { $in: courseIds } });
      const assignmentIds = assignments.map((a) => a._id);

      if (assignmentIds.length === 0) {
        return [];
      }

      // Get all pending (submitted but not graded) submissions
      const pendingSubmissions = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
        status: 'submitted',
      })
        .populate('assignmentId', 'title courseId dueDate')
        .populate('studentId', 'name email')
        .sort({ createdAt: -1 });

      return pendingSubmissions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AssignmentService();
