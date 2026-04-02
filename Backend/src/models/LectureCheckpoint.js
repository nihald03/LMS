const mongoose = require('mongoose');

const CheckpointQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: [
      {
        optionId: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
      },
    ],
    correctOptionId: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      trim: true,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
      max: 100,
    },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    bloomsLevel: {
      type: String,
      enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
      default: 'understand',
    },
  },
  { _id: false }
);

const LectureCheckpointSchema = new mongoose.Schema(
  {
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
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkpoints: [CheckpointQuestionSchema],
    totalPoints: {
      type: Number,
      default: 0,
    },
    checkpointCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    responseCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
LectureCheckpointSchema.index({ lectureId: 1, courseId: 1 });
LectureCheckpointSchema.index({ teacherId: 1, createdAt: -1 });

module.exports = mongoose.model('LectureCheckpoint', LectureCheckpointSchema);
