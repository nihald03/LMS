const mongoose = require('mongoose');

const LectureSchema = new mongoose.Schema(
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
      trim: true,
    },
    lectureNumber: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
    },
    materials: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['pdf', 'video', 'document', 'link', 'code', 'other'],
          default: 'document',
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    videoUrl: {
      type: String,
      trim: true,
    },
    videoPath: {
      type: String,
      trim: true,
      description: 'Path to uploaded video file'
    },
    videoDuration: {
      type: Number,
      description: 'Duration of video in seconds'
    },
    videoSize: {
      type: Number,
      description: 'File size in bytes'
    },
    videoUploadedAt: {
      type: Date,
      description: 'When video was uploaded'
    },
    videoUploadStatus: {
      type: String,
      enum: ['pending', 'uploaded', 'processing', 'ready', 'failed'],
      default: 'pending'
    },
    scheduledDate: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    inLectureQuestions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InLectureQuestion',
      },
    ],
    attendance: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student',
        },
        attendanceMarkedAt: {
          type: Date,
        },
        isPresent: {
          type: Boolean,
          default: false,
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

module.exports = mongoose.model('Lecture', LectureSchema);
