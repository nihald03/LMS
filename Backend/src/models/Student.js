const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      required: false,
      trim: true,
    },
    semester: {
      type: Number,
      default: 1,
      min: 1,
      max: 8,
    },
    gpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    totalCreditsCompleted: {
      type: Number,
      default: 0,
    },
    totalCreditsEnrolled: {
      type: Number,
      default: 0,
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    completedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    attendance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'suspended'],
      default: 'active',
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

// Index for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ enrolledCourses: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
