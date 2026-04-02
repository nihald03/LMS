const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Please provide student ID'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Please provide course ID'],
      index: true,
    },
    action: {
      type: String,
      enum: [
        'viewed_lecture',
        'submitted_assignment',
        'started_quiz',
        'completed_quiz',
        'viewed_announcement',
        'responded_to_question',
        'accessed_course',
        'downloaded_material',
        'viewed_grade',
        'viewed_feedback',
      ],
      required: [true, 'Please provide action type'],
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      default: null,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null,
    },
    announcementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Announcement',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: false }
);

// Index for efficient querying
activityLogSchema.index({ studentId: 1, timestamp: -1 });
activityLogSchema.index({ courseId: 1, timestamp: -1 });
activityLogSchema.index({ studentId: 1, courseId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
