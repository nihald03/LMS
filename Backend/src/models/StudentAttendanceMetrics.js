const mongoose = require('mongoose');

const StudentAttendanceMetricsSchema = new mongoose.Schema(
  {
    studentId: {
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
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    metrics: {
      lectureEngagement: {
        totalLecturesAvailable: Number,
        lecturesAttended: Number,
        averageWatchTime: Number,
        checkpointAttempts: Number,
        checkpointCorrect: Number,
        checkpointAccuracy: Number,
      },
      assignmentMetrics: {
        totalAssignments: Number,
        assignmentsSubmitted: Number,
        onTimeSubmissions: Number,
        lateSubmissions: Number,
        averageScore: Number,
        averageMarks: Number,
      },
      quizMetrics: {
        totalQuizzes: Number,
        quizzesTaken: Number,
        averageQuizScore: Number,
        bestScore: Number,
        worstScore: Number,
      },
    },
    calculatedMetrics: {
      lectureContribution: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      assignmentContribution: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      quizContribution: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalAttendance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      attendanceStatus: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor', 'at-risk'],
        default: 'average',
        index: true,
      },
      attendanceTrend: {
        type: String,
        enum: ['improving', 'stable', 'declining'],
        default: 'stable',
      },
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
StudentAttendanceMetricsSchema.index({ studentId: 1, courseId: 1 });
StudentAttendanceMetricsSchema.index({ courseId: 1, 'calculatedMetrics.attendanceStatus': 1 });
StudentAttendanceMetricsSchema.index({ courseId: 1, 'period.endDate': -1 });

module.exports = mongoose.model('StudentAttendanceMetrics', StudentAttendanceMetricsSchema);
