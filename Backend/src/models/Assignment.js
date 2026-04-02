const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignmentNumber: {
      type: Number,
      // OPTIONAL - not required, auto-generated if needed
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    submissionType: {
      type: String,
      enum: ['file', 'text', 'link'],
      default: 'file',
    },
    allowedFormats: [String], // e.g., ['.pdf', '.docx', '.txt']
    instructions: {
      type: String,
      // Optional: assignment instructions for students
    },
    rubric: {
      type: String,
      // Optional: grading rubric
    },
    allowLateSubmission: {
      type: Boolean,
      default: true,
    },
    latePenalty: {
      type: Number,
      default: 10, // Penalty percentage
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    submissions: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        submissionDate: {
          type: Date,
          default: Date.now,
        },
        submissionContent: {
          type: String, // URL for file upload or text content
          required: true,
        },
        fileName: String,
        isLate: Boolean,
        submittedStatus: {
          type: String,
          enum: ['submitted', 'graded', 'pending'],
          default: 'pending',
        },
        feedback: String,
        pointsAwarded: {
          type: Number,
          default: 0,
        },
        gradedAt: Date,
        gradedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assignment', AssignmentSchema);
