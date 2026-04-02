/**
 * Progress Service - Calculate student progress, GPA, grades, and reports
 * Handles all progress-related business logic
 */

const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const StudentResponse = require('../models/StudentResponse');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const Lecture = require('../models/Lecture');
const QuizQuestion = require('../models/QuizQuestion');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const InLectureQuestion = require('../models/InLectureQuestion');
const gradingService = require('./gradingService');

class ProgressService {
  /**
   * Calculate progress percentage for a student in a course
   * Formula: (completed_items / total_items) * 100
   */
  async calculateCourseProgress(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      const courseId = enrollment.courseId._id;

      // Get total items
      const lectures = await Lecture.countDocuments({ courseId });
      const assignments = await Assignment.countDocuments({ courseId });
      const quizzes = await Quiz.countDocuments({ courseId });

      const totalItems = lectures + assignments + quizzes;

      if (totalItems === 0) {
        return 0;
      }

      // Get completed items
      const lectureViews = enrollment.viewedLectures ? enrollment.viewedLectures.length : 0;

      const assignmentSubmissions = await StudentResponse.countDocuments({
        studentId: enrollment.studentId,
        courseId,
        responseType: 'assignment'
      });

      const quizAttempts = await StudentResponse.countDocuments({
        studentId: enrollment.studentId,
        courseId,
        responseType: 'quiz'
      });

      const completedItems = lectureViews + assignmentSubmissions + quizAttempts;

      const progressPercentage = (completedItems / totalItems) * 100;

      return {
        enrollmentId,
        courseId,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        completedItems,
        totalItems,
        breakdown: {
          lectures: {
            completed: lectureViews,
            total: lectures,
            percentage: lectures > 0 ? Math.round((lectureViews / lectures) * 100) : 0
          },
          assignments: {
            completed: assignmentSubmissions,
            total: assignments,
            percentage: assignments > 0 ? Math.round((assignmentSubmissions / assignments) * 100) : 0
          },
          quizzes: {
            completed: quizAttempts,
            total: quizzes,
            percentage: quizzes > 0 ? Math.round((quizAttempts / quizzes) * 100) : 0
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to calculate course progress: ${error.message}`);
    }
  }

  /**
   * Calculate grade for a course based on various components
   * Components: quizzes, assignments, attendance, in-lecture questions
   * Now delegated to gradingService for hybrid grading system
   */
  async calculateCourseGrade(enrollmentId, courseId) {
    try {
      // Get enrollment to extract studentId
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Delegate to grading service for comprehensive grade calculation
      const gradeResult = await gradingService.calculateCourseGrade(
        enrollment.studentId,
        courseId
      );

      return gradeResult.grade;
    } catch (error) {
      throw new Error(`Failed to calculate course grade: ${error.message}`);
    }
  }

  /**
   * Get student's dashboard data
   */
  async getStudentDashboard(studentId) {
    try {
      const enrollments = await Enrollment.find({
        studentId,
        status: 'active'
      }).populate('courseId').lean();

      const enrollmentIds = enrollments.map(e => e._id);

      // Get courses with progress
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const progress = await this.calculateCourseProgress(enrollment._id);
          const gradeData = await this.calculateCourseGrade(enrollment._id, enrollment.courseId._id);

          return {
            courseId: enrollment.courseId._id,
            courseName: enrollment.courseId.courseName,
            courseCode: enrollment.courseCode,
            instructor: enrollment.courseId.instructor,
            progress: progress.progressPercentage,
            currentGrade: gradeData.finalScore,
            letterGrade: gradeData.letterGrade,
            attendance: enrollment.attendancePercentage || 0
          };
        })
      );

      // Get pending assignments
      const pendingAssignments = await Assignment.find({
        courseId: { $in: enrollments.map(e => e.courseId._id) },
        dueDate: { $gt: new Date() }
      }).select('title dueDate courseId').lean();

      // Get upcoming quizzes
      const upcomingQuizzes = await Quiz.find({
        courseId: { $in: enrollments.map(e => e.courseId._id) },
        startDate: { $gt: new Date() }
      }).select('title startDate courseId').lean();

      // Calculate overall statistics
      const averageGrade = coursesWithProgress.length > 0
        ? Math.round((coursesWithProgress.reduce((sum, c) => sum + c.currentGrade, 0) / coursesWithProgress.length) * 100) / 100
        : 0;

      const averageAttendance = coursesWithProgress.length > 0
        ? Math.round((coursesWithProgress.reduce((sum, c) => sum + c.attendance, 0) / coursesWithProgress.length) * 100) / 100
        : 0;

      return {
        studentId,
        enrolledCourses: coursesWithProgress,
        totalCoursesEnrolled: coursesWithProgress.length,
        averageGrade,
        averageAttendance,
        pendingAssignments: pendingAssignments.slice(0, 5),
        upcomingQuizzes: upcomingQuizzes.slice(0, 5),
        courseCount: {
          excellent: coursesWithProgress.filter(c => c.currentGrade >= 90).length,
          good: coursesWithProgress.filter(c => c.currentGrade >= 80 && c.currentGrade < 90).length,
          average: coursesWithProgress.filter(c => c.currentGrade >= 70 && c.currentGrade < 80).length,
          poor: coursesWithProgress.filter(c => c.currentGrade < 70).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get student dashboard: ${error.message}`);
    }
  }

  /**
   * Get student's transcript (all grades and GPA)
   */
  async getStudentTranscript(studentId) {
    try {
      const enrollments = await Enrollment.find({
        studentId
      }).populate('courseId').lean();

      const grades = await Promise.all(
        enrollments.map(async (enrollment) => {
          const gradeData = await this.calculateCourseGrade(enrollment._id, enrollment.courseId._id);
          return {
            courseId: enrollment.courseId._id,
            courseName: enrollment.courseId.courseName,
            courseCode: enrollment.courseCode,
            credits: enrollment.courseId.credits || 3,
            enrollmentDate: enrollment.enrollmentDate,
            finalScore: gradeData.finalScore,
            letterGrade: gradeData.letterGrade,
            gpa: gradeData.gpa
          };
        })
      );

      // Calculate overall GPA
      const totalCredits = grades.reduce((sum, g) => sum + (g.credits || 3), 0);
      const totalGradePoints = grades.reduce((sum, g) => sum + ((g.gpa || 0) * (g.credits || 3)), 0);
      const overallGPA = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;

      return {
        studentId,
        transcript: grades,
        totalCredits,
        completedCourses: grades.length,
        overallGPA,
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get student transcript: ${error.message}`);
    }
  }

  /**
   * Get attendance summary for student
   */
  async getStudentAttendance(studentId) {
    try {
      const enrollments = await Enrollment.find({ studentId })
        .populate('courseId')
        .lean();

      const attendanceByCourse = await Promise.all(
        enrollments.map(async (enrollment) => {
          const records = await AttendanceRecord.find({
            enrollmentId: enrollment._id,
            studentId
          });

          const totalClasses = records.length;
          const attended = records.filter(r => r.isPresent).length;
          const percentage = totalClasses > 0
            ? (attended / totalClasses) * 100
            : 0;

          return {
            courseId: enrollment.courseId._id,
            courseName: enrollment.courseId.courseName,
            totalClasses,
            attended,
            missed: totalClasses - attended,
            percentage: Math.round(percentage * 100) / 100,
            status: percentage >= 75 ? 'Good' : 'At Risk'
          };
        })
      );

      const overallAttendance =
        attendanceByCourse.length > 0
          ? Math.round(
            (attendanceByCourse.reduce((sum, a) => sum + a.percentage, 0) /
              attendanceByCourse.length) * 100
          ) / 100
          : 0;

      return {
        studentId,
        attendanceByCourse,
        overallAttendance,
        lastUpdated: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to get student attendance: ${error.message}`);
    }
  }

  /**
   * Convert numerical score to letter grade
   */
  getLetterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Convert score to 4.0 GPA scale
   */
  convertScoreToGPA(score) {
    if (score >= 90) return 4.0;
    if (score >= 85) return 3.7;
    if (score >= 80) return 3.3;
    if (score >= 75) return 3.0;
    if (score >= 70) return 2.7;
    if (score >= 65) return 2.3;
    if (score >= 60) return 2.0;
    return 0;
  }

  /**
   * Generate detailed progress report
   */
  async generateProgressReport(studentId, courseId) {
    try {
      const enrollment = await Enrollment.findOne({
        studentId,
        courseId
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      const progress = await this.calculateCourseProgress(enrollment._id);
      const gradeData = await this.calculateCourseGrade(enrollment._id, courseId);

      // Get recent activities
      const recentActivities = await ActivityLog.find({
        studentId,
        courseId
      }).sort({ timestamp: -1 }).limit(10).lean();

      // Get all submissions
      const submissions = await StudentResponse.find({
        studentId,
        courseId
      }).sort({ submissionDate: -1 }).lean();

      return {
        studentId,
        courseId,
        progress: progress.progressPercentage,
        grades: gradeData,
        recentActivities,
        submissions: {
          total: submissions.length,
          graded: submissions.filter(s => s.status === 'graded').length,
          pending: submissions.filter(s.status === 'pending').length
        },
        generatedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to generate progress report: ${error.message}`);
    }
  }


  async generateClassProgressSummary(courseId) {
    try {
      // Get all active + completed enrollments
      const enrollments = await Enrollment.find({
        courseId,
        status: { $in: ['active', 'completed'] }
      })
        .populate('studentId')
        .lean();

      if (!enrollments.length) {
        return {
          courseId,
          totalStudents: 0,
          averageProgress: 0,
          students: []
        };
      }

      let totalProgress = 0;

      const students = await Promise.all(
        enrollments.map(async (enrollment) => {
          const progress = await this.calculateCourseProgress(enrollment._id);
          totalProgress += progress.progressPercentage;

          return {
            studentId: enrollment.studentId._id,
            enrollmentId: enrollment._id,
            progress: progress.progressPercentage,
            attendance: enrollment.attendancePercentage || 0,
            grade: enrollment.grade || null,
            gpa: enrollment.gpa || 0
          };
        })
      );

      return {
        courseId,
        totalStudents: students.length,
        averageProgress:
          Math.round((totalProgress / students.length) * 100) / 100,
        students
      };
    } catch (error) {
      throw new Error(
        `Failed to generate class progress summary: ${error.message}`
      );
    }
  }
}

module.exports = new ProgressService();
