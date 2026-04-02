const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    quizNumber: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      default: 100,
    },
    passingScore: {
      type: Number,
      default: 40,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    allowMultipleAttempts: {
      type: Boolean,
      default: true,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
      },
    ],
    attempts: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
          required: true,
        },
        attemptNumber: {
          type: Number,
          default: 1,
        },
        startTime: Date,
        endTime: Date,
        answers: [
          {
            questionId: mongoose.Schema.Types.ObjectId,
            selectedOptions: [String],
            isCorrect: Boolean,
            pointsEarned: Number,
          },
        ],
        totalPoints: Number,
        percentage: Number,
        isPassed: Boolean,
        attemptedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', QuizSchema);
