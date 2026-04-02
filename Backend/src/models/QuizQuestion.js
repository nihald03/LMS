const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questionNumber: {
      type: Number,
      required: true,
    },
    questionType: {
      type: String,
      enum: ['mcq', 'multiple_select', 'short_answer', 'essay'],
      default: 'mcq',
    },
    questionText: {
      type: String,
      required: true,
    },
    imageUrl: String,
    points: {
      type: Number,
      default: 1,
    },
    options: [
      {
        optionId: String,
        optionText: {
          type: String,
          required: true,
        },
        isCorrect: Boolean,
        explanation: String,
      },
    ],
    correctAnswer: {
      type: String, // for essay/short answer questions
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: [String], // For categorizing questions
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

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
