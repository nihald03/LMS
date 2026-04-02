const mongoose = require('mongoose');

const TeacherAnalyticsDashboardSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    aggregatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    courseStatistics: {
      totalStudents: {
        type: Number,
        default: 0,
      },
      enrolledStudents: {
        type: Number,
        default: 0,
      },
      activeStudents: {
        type: Number,
        default: 0,
      },
      inactiveStudents: {
        type: Number,
        default: 0,
      },
      averageAttendance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      attendanceDistribution: {
        excellent: Number,
        good: Number,
        average: Number,
        poor: Number,
        atRisk: Number,
      },
      averageAssignmentScore: {
        type: Number,
        default: 0,
      },
      averageQuizScore: {
        type: Number,
        default: 0,
      },
      overallGradeDistribution: {
        a: Number,
        b: Number,
        c: Number,
        d: Number,
        f: Number,
      },
      completionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    topPerformers: [
      {
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String,
        attendance: Number,
        averageScore: Number,
      },
    ],
    needsAttention: [
      {
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String,
        attendance: Number,
        averageScore: Number,
        reason: String,
      },
    ],
    realtimeAlerts: [
      {
        alertId: String,
        studentId: mongoose.Schema.Types.ObjectId,
        studentName: String,
        alertType: {
          type: String,
          enum: ['low_attendance', 'assignment_pending', 'quiz_poor_score', 'engagement_drop'],
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          default: 'medium',
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        resolved: {
          type: Boolean,
          default: false,
        },
        resolutionNotes: String,
      },
    ],
    lectureLevelMetrics: {
      totalLectures: Number,
      averageLectureAttendance: Number,
      mostWatchedLecture: String,
      leastWatchedLecture: String,
      averageCheckpointAccuracy: Number,
    },
    assignmentMetrics: {
      totalAssignments: Number,
      totalSubmissions: Number,
      submissionRate: Number,
      averageGrade: Number,
      onTimeSubmissionRate: Number,
    },
    engagementScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
TeacherAnalyticsDashboardSchema.index({ teacherId: 1, courseId: 1 });
TeacherAnalyticsDashboardSchema.index({ teacherId: 1, aggregatedAt: -1 });

module.exports = mongoose.model('TeacherAnalyticsDashboard', TeacherAnalyticsDashboardSchema);
