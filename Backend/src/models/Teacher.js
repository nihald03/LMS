const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    teacherId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      required: false,
      trim: true,
      default: 'General',
    },
    designation: {
      type: String,
      enum: ['Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'],
      default: 'Lecturer',
    },
    expertise: [
      {
        type: String,
        trim: true,
      },
    ],
    coursesAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    coursesTaught: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    studentsTeaching: {
      type: Number,
      default: 0,
    },
    qualifications: [
      {
        degree: String,
        field: String,
        institution: String,
        year: Number,
      },
    ],
    officeLocation: {
      type: String,
      default: null,
    },
    officeHours: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    phoneNumber: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'retired'],
      default: 'active',
    },
    joinDate: {
      type: Date,
      default: Date.now,
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
teacherSchema.index({ userId: 1 });
teacherSchema.index({ teacherId: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ coursesAssigned: 1 });

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
