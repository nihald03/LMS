const mongoose = require('mongoose');

/**
 * AttendanceRecord Model
 * 
 * Records individual attendance events from different sources:
 * - Lecture: In-lecture question answered
 * - Quiz: Quiz attempted/submitted
 * - Assignment: Assignment submitted
 * 
 * Multiple records per student per course per source type
 */
const attendanceRecordSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    
    // Source type: lecture, quiz, or assignment
    sourceType: {
      type: String,
      enum: ['lecture', 'quiz', 'assignment'],
      required: [true, 'Source type is required'],
      index: true,
    },
    
    // Reference to the source
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Source ID is required'],
    },
    
    // Source name for reporting
    sourceName: {
      type: String,
      required: true,
    },
    
    // Mark attendance as present (true) or absent (false)
    isPresent: {
      type: Boolean,
      default: true,
    },
    
    // Metadata about the attendance event
    details: {
      // For lecture: question ID and response
      lectureQuestionId: mongoose.Schema.Types.ObjectId,
      lectureQuestionTitle: String,
      lectureDate: Date,
      
      // For quiz: quiz attempts/submissions
      quizAttemptId: mongoose.Schema.Types.ObjectId,
      quizSubmittedAt: Date,
      
      // For assignment: submission timestamp
      assignmentSubmittedAt: Date,
      submissionId: mongoose.Schema.Types.ObjectId,
      
      // Additional notes
      notes: String,
    },
    
    // Timestamp of attendance record creation
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
attendanceRecordSchema.index({ enrollmentId: 1, sourceType: 1 });
attendanceRecordSchema.index({ studentId: 1, courseId: 1, sourceType: 1 });
attendanceRecordSchema.index({ courseId: 1, sourceType: 1 });
attendanceRecordSchema.index({ recordedAt: 1 });
attendanceRecordSchema.index({ enrollmentId: 1, recordedAt: 1 });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = AttendanceRecord;
