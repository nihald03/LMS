const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
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
    submissionFile: {
      url: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
        required: true,
      },
      mimeType: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateBy: {
      type: Number,
      default: 0,
    },
    grade: {
      marks: {
        type: Number,
        required: false,
      },
      outOf: {
        type: Number,
        default: 100,
      },
      percentage: {
        type: Number,
        required: false,
      },
      letterGrade: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'F', 'N/A'],
        default: 'N/A',
      },
      feedback: {
        type: String,
        trim: true,
      },
      gradedAt: {
        type: Date,
      },
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmitted'],
      default: 'submitted',
      index: true,
    },
    resubmissionCount: {
      type: Number,
      default: 0,
    },
    comments: [
      {
        commentedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
AssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 });
AssignmentSubmissionSchema.index({ courseId: 1, status: 1 });
AssignmentSubmissionSchema.index({ studentId: 1, submittedAt: -1 });

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
