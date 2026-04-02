const mongoose = require('mongoose');

const StudentActivityLogSchema = new mongoose.Schema(
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'lecture_start',
        'lecture_end',
        'checkpoint_answer',
        'assignment_submit',
        'assignment_view',
        'quiz_start',
        'quiz_end',
        'note_created',
        'video_pause',
        'video_resume',
        'playback_speed_change',
        'resource_download',
      ],
      required: true,
      index: true,
    },
    activityData: {
      lectureId: mongoose.Schema.Types.ObjectId,
      lectureTitle: String,
      watchDuration: Number,
      totalLectureDuration: Number,
      videoProgress: Number,
      checkpointId: mongoose.Schema.Types.ObjectId,
      questionId: String,
      selectedOption: String,
      isCorrect: Boolean,
      score: Number,
      assignmentId: mongoose.Schema.Types.ObjectId,
      assignmentTitle: String,
      submissionId: mongoose.Schema.Types.ObjectId,
      quizId: mongoose.Schema.Types.ObjectId,
      quizScore: Number,
      resourceName: String,
      resourceType: String,
      customData: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sessionId: {
      type: String,
      required: false,
      index: true,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
    device: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile'],
      required: false,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient querying
StudentActivityLogSchema.index({ studentId: 1, courseId: 1, timestamp: -1 });
StudentActivityLogSchema.index({ courseId: 1, activityType: 1, timestamp: -1 });
StudentActivityLogSchema.index({ studentId: 1, timestamp: -1 });

// TTL index - keep logs for 1 year (31536000 seconds)
StudentActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('StudentActivityLog', StudentActivityLogSchema);
