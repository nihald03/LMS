/**
 * Attendance Service
 * 
 * Handles:
 * - Recording attendance from different sources
 * - Computing overall attendance percentage
 * - Updating enrollment attendance
 * - Handling concurrent requests
 */

const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceConfig = require('../models/AttendanceConfig');
const Enrollment = require('../models/Enrollment');

class AttendanceService {
  /**
   * Record attendance from a source (lecture, quiz, assignment)
   * @param {Object} params
   * @returns {Promise<Object>} Attendance record and updated enrollment
   */
  static async recordAttendance({
    enrollmentId,
    studentId,
    courseId,
    sourceType, // 'lecture', 'quiz', 'assignment'
    sourceId,
    sourceName,
    isPresent = true,
    details = {},
  }) {
    try {
      // Create attendance record
      const attendanceRecord = new AttendanceRecord({
        enrollmentId,
        studentId,
        courseId,
        sourceType,
        sourceId,
        sourceName,
        isPresent,
        details,
        recordedAt: new Date(),
      });

      await attendanceRecord.save();

      // Recalculate overall attendance percentage
      const updatedEnrollment = await this.recalculateEnrollmentAttendance(
        enrollmentId,
        courseId
      );

      return {
        success: true,
        attendanceRecord,
        enrollment: updatedEnrollment,
      };
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw error;
    }
  }

  /**
   * Recalculate overall attendance percentage for an enrollment
   * @param {String} enrollmentId
   * @param {String} courseId
   * @returns {Promise<Object>} Updated enrollment
   */
  static async recalculateEnrollmentAttendance(enrollmentId, courseId) {
    try {
      // Get attendance configuration for the course
      let config = await AttendanceConfig.findOne({ courseId });

      // If no config exists, create default one
      if (!config) {
        config = await AttendanceConfig.create({
          courseId,
          weights: {
            lecture: 33.33,
            quiz: 33.33,
            assignment: 33.34,
          },
        });
      }

      // Get all attendance records for this enrollment
      const [lectureRecords, quizRecords, assignmentRecords] = await Promise.all([
        AttendanceRecord.find({
          enrollmentId,
          sourceType: 'lecture',
        }),
        AttendanceRecord.find({
          enrollmentId,
          sourceType: 'quiz',
        }),
        AttendanceRecord.find({
          enrollmentId,
          sourceType: 'assignment',
        }),
      ]);

      // Calculate attendance percentage for each source type
      const lectureAttendance =
        lectureRecords.length > 0
          ? (lectureRecords.filter((r) => r.isPresent).length /
              lectureRecords.length) *
            100
          : 0;

      const quizAttendance =
        quizRecords.length > 0
          ? (quizRecords.filter((r) => r.isPresent).length /
              quizRecords.length) *
            100
          : 0;

      const assignmentAttendance =
        assignmentRecords.length > 0
          ? (assignmentRecords.filter((r) => r.isPresent).length /
              assignmentRecords.length) *
            100
          : 0;

      // Calculate overall attendance based on configuration
      let overallAttendance = 0;

      if (config.calculationMethod === 'weighted') {
        overallAttendance =
          (lectureAttendance * (config.weights.lecture / 100) || 0) +
          (quizAttendance * (config.weights.quiz / 100) || 0) +
          (assignmentAttendance * (config.weights.assignment / 100) || 0);
      } else if (config.calculationMethod === 'average') {
        let activeSourceCount = 0;
        let sum = 0;

        if (config.includeLectures) {
          sum += lectureAttendance;
          activeSourceCount++;
        }
        if (config.includeQuizzes) {
          sum += quizAttendance;
          activeSourceCount++;
        }
        if (config.includeAssignments) {
          sum += assignmentAttendance;
          activeSourceCount++;
        }

        overallAttendance =
          activeSourceCount > 0 ? sum / activeSourceCount : 0;
      } else if (config.calculationMethod === 'minimum') {
        const values = [];
        if (config.includeLectures) values.push(lectureAttendance);
        if (config.includeQuizzes) values.push(quizAttendance);
        if (config.includeAssignments) values.push(assignmentAttendance);

        overallAttendance = values.length > 0 ? Math.min(...values) : 0;
      }

      // Update enrollment with overall attendance percentage
      const enrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        {
          attendancePercentage: Math.round(overallAttendance * 100) / 100,
        },
        { new: true }
      );

      return enrollment;
    } catch (error) {
      console.error('Error recalculating attendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance breakdown for a student in a specific course
   * @param {String} enrollmentId
   * @returns {Promise<Object>} Attendance breakdown with overall percentage
   */
  static async getAttendanceBreakdown(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('studentId')
        .populate('courseId');

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Get config
      const config = await AttendanceConfig.findOne({
        courseId: enrollment.courseId._id,
      });

      // Get all records grouped by source type
      const [lectureRecords, quizRecords, assignmentRecords] = await Promise.all(
        [
          AttendanceRecord.find({
            enrollmentId,
            sourceType: 'lecture',
          }).sort({ recordedAt: -1 }),
          AttendanceRecord.find({
            enrollmentId,
            sourceType: 'quiz',
          }).sort({ recordedAt: -1 }),
          AttendanceRecord.find({
            enrollmentId,
            sourceType: 'assignment',
          }).sort({ recordedAt: -1 }),
        ]
      );

      // Calculate percentages
      const calculatePercentage = (records) => {
        if (records.length === 0) return 0;
        return (
          (records.filter((r) => r.isPresent).length / records.length) * 100
        );
      };

      const lectureAttendance = calculatePercentage(lectureRecords);
      const quizAttendance = calculatePercentage(quizRecords);
      const assignmentAttendance = calculatePercentage(assignmentRecords);

      return {
        enrollmentId: enrollment._id,
        studentId: enrollment.studentId._id,
        studentName: enrollment.studentId.firstName + ' ' + enrollment.studentId.lastName,
        courseId: enrollment.courseId._id,
        courseName: enrollment.courseId.courseName,
        
        // Breakdown by source
        bySource: {
          lecture: {
            totalRecords: lectureRecords.length,
            presentCount: lectureRecords.filter((r) => r.isPresent).length,
            percentage: Math.round(lectureAttendance * 100) / 100,
            records: lectureRecords.slice(0, 10), // Latest 10 for details
          },
          quiz: {
            totalRecords: quizRecords.length,
            presentCount: quizRecords.filter((r) => r.isPresent).length,
            percentage: Math.round(quizAttendance * 100) / 100,
            records: quizRecords.slice(0, 10),
          },
          assignment: {
            totalRecords: assignmentRecords.length,
            presentCount: assignmentRecords.filter((r) => r.isPresent).length,
            percentage: Math.round(assignmentAttendance * 100) / 100,
            records: assignmentRecords.slice(0, 10),
          },
        },
        
        // Overall
        overall: {
          percentage: enrollment.attendancePercentage,
          isDefaulter: enrollment.attendancePercentage < (config?.defaulterThreshold || 75),
          threshold: config?.defaulterThreshold || 75,
        },
        
        // Configuration used
        config: config
          ? {
              weights: config.weights,
              calculationMethod: config.calculationMethod,
            }
          : null,
      };
    } catch (error) {
      console.error('Error getting attendance breakdown:', error);
      throw error;
    }
  }

  /**
   * Get course-wide attendance analytics
   * @param {String} courseId
   * @returns {Promise<Object>} Course attendance statistics
   */
  static async getCourseAttendanceAnalytics(courseId) {
    try {
      // Get all enrollments for the course
      const enrollments = await Enrollment.find({ courseId }).populate(
        'studentId'
      );

      if (enrollments.length === 0) {
        return {
          courseId,
          totalStudents: 0,
          statistics: null,
        };
      }

      // Calculate statistics
      const attendancePercentages = enrollments.map(
        (e) => e.attendancePercentage
      );

      const stats = {
        totalStudents: enrollments.length,
        average: Math.round((attendancePercentages.reduce((a, b) => a + b, 0) / 
          enrollments.length) * 100) / 100,
        median: this.calculateMedian(attendancePercentages),
        min: Math.min(...attendancePercentages),
        max: Math.max(...attendancePercentages),
        standardDeviation: this.calculateStdDev(attendancePercentages),
      };

      // Get attendance record counts by source
      const [lectureCount, quizCount, assignmentCount] = await Promise.all([
        AttendanceRecord.countDocuments({
          courseId,
          sourceType: 'lecture',
        }),
        AttendanceRecord.countDocuments({
          courseId,
          sourceType: 'quiz',
        }),
        AttendanceRecord.countDocuments({
          courseId,
          sourceType: 'assignment',
        }),
      ]);

      // Get defaulters
      const config = await AttendanceConfig.findOne({ courseId });
      const threshold = config?.defaulterThreshold || 75;
      const defaulters = enrollments
        .filter((e) => e.attendancePercentage < threshold)
        .map((e) => ({
          studentId: e.studentId._id,
          studentName:
            e.studentId.firstName + ' ' + e.studentId.lastName,
          email: e.studentId.email,
          enrollment: e._id,
          attendancePercentage: e.attendancePercentage,
        }));

      return {
        courseId,
        statistics: stats,
        recordCounts: {
          lecture: lectureCount,
          quiz: quizCount,
          assignment: assignmentCount,
        },
        defaultersCount: defaulters.length,
        defaulterThreshold: threshold,
        defaulters,
      };
    } catch (error) {
      console.error('Error getting course attendance analytics:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate median
   */
  static calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Helper: Calculate standard deviation
   */
  static calculateStdDev(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance =
      arr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }
}

module.exports = AttendanceService;
