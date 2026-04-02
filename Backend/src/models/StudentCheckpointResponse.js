const mongoose = require('mongoose');

const StudentCheckpointResponseSchema = new mongoose.Schema(
  {
    checkpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LectureCheckpoint',
      required: true,
      index: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      required: true,
    },
    selectedOptionId: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
      index: true,
    },
    marksObtained: {
      type: Number,
      default: 0,
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    timeToAnswer: {
      type: Number,
      default: 0,
    },
    respondedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['attempted', 'skipped', 'flagged'],
      default: 'attempted',
    },
    watchedSegment: {
      startTime: Number,
      endTime: Number,
      duration: Number,
    },
    sessionId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
StudentCheckpointResponseSchema.index({ studentId: 1, courseId: 1 });
StudentCheckpointResponseSchema.index({ lectureId: 1, studentId: 1 });
StudentCheckpointResponseSchema.index({ isCorrect: 1, respondedAt: -1 });

module.exports = mongoose.model('StudentCheckpointResponse', StudentCheckpointResponseSchema);
