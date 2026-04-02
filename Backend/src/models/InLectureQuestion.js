const mongoose = require('mongoose');

const InLectureQuestionSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer'],
      default: 'mcq',
    },
    timeMarker: {
      type: Number, // in seconds from start of lecture
      required: true,
    },
    options: [
      {
        optionId: String,
        optionText: {
          type: String,
          required: true,
        },
        isCorrect: Boolean,
      },
    ],
    points: {
      type: Number,
      default: 1,
    },
    isAutoGraded: {
      type: Boolean,
      default: true,
    },
    studentResponses: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // ✅ IMPORTANT FIX
          required: true,
        },
        selectedOption: String,
        isCorrect: Boolean,
        pointsAwarded: Number,
        answeredAt: Date,
        isPresent: {
          type: Boolean,
          default: true,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InLectureQuestion', InLectureQuestionSchema);
