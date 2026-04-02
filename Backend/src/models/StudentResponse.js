/**
 * StudentResponse Model - Store individual student quiz responses and answers
 * Links to student, quiz, questions, and tracks correctness and marks
 */

const mongoose = require('mongoose');

const studentResponseSchema = new mongoose.Schema(
  {
    // Student information
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },

    // Quiz information
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true
    },

    // Course information
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true
    },

    // Enrollment information
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      index: true
    },

    // Individual question response
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizQuestion',
      required: true,
      index: true
    },

    // Student's selected option(s)
    selectedOption: {
      type: String,
      default: null
    },

    // Multiple selected options (for multiple choice questions)
    selectedOptions: [
      {
        type: String,
        default: null
      }
    ],

    // Whether the response is correct
    isCorrect: {
      type: Boolean,
      default: false
    },

    // Marks awarded for this response
    marksAwarded: {
      type: Number,
      min: 0,
      default: 0
    },

    // Total marks possible for this question
    totalMarks: {
      type: Number,
      min: 0,
      default: 1
    },

    // Attempt number (if multiple attempts allowed)
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1
    },

    // Time spent on this question (in seconds)
    timeSpent: {
      type: Number,
      min: 0,
      default: 0
    },

    // Feedback for this response
    feedback: {
      type: String,
      default: null
    },

    // Response type (for filtering)
    responseType: {
      type: String,
      enum: ['quiz', 'practice', 'assessment'],
      default: 'quiz'
    },

    // Status of the response
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted'
    },

    // IP address of submission
    submittedFrom: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    indexes: [
      { studentId: 1, quizId: 1 },
      { studentId: 1, courseId: 1 },
      { quizId: 1, studentId: 1 },
      { attemptNumber: 1, studentId: 1, quizId: 1 },
      { createdAt: -1 }
    ]
  }
);

// Calculate percentage score for this question
studentResponseSchema.virtual('percentage').get(function() {
  if (this.totalMarks === 0) return 0;
  return (this.marksAwarded / this.totalMarks) * 100;
});

// Index for fast lookups
studentResponseSchema.index({ studentId: 1, quizId: 1 });
studentResponseSchema.index({ studentId: 1, courseId: 1 });
studentResponseSchema.index({ quizId: 1, studentId: 1 });
studentResponseSchema.index({ attemptNumber: 1, studentId: 1, quizId: 1 });

module.exports = mongoose.model('StudentResponse', studentResponseSchema);
