const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Please provide course code'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be 2-4 letters followed by 3-4 numbers (e.g., CS101)'],
    },
    courseName: {
      type: String,
      required: [true, 'Please provide course name'],
      trim: true,
      minlength: [5, 'Course name must be at least 5 characters'],
      maxlength: [100, 'Course name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide course description'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    credits: {
      type: Number,
      required: [true, 'Please provide course credits'],
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits cannot exceed 6'],
    },
    semester: {
      type: Number,
      required: [true, 'Please provide semester'],
      min: [1, 'Semester must be at least 1'],
      max: [8, 'Semester cannot exceed 8'],
    },
    capacity: {
      type: Number,
      required: [true, 'Please provide course capacity'],
      min: [10, 'Capacity must be at least 10'],
      max: [500, 'Capacity cannot exceed 500'],
    },
    enrolledStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a teacher'],
    },
    department: {
      type: String,
      required: [true, 'Please specify department'],
      trim: true,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String, // Format: HH:MM (24-hour)
        endTime: String,   // Format: HH:MM (24-hour)
        room: String,
      },
    ],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    enrolledStudentsList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed', 'archived'],
      default: 'active',
    },
    syllabus: {
      type: String,
      default: null,
    },
    textbooks: [String],
    assessmentWeights: {
      attendance: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      quizzes: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      assignments: {
        type: Number,
        default: 20,
        min: 0,
        max: 100,
      },
      midterm: {
        type: Number,
        default: 25,
        min: 0,
        max: 100,
      },
      final: {
        type: Number,
        default: 25,
        min: 0,
        max: 100,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Indexes for faster queries
courseSchema.index({ courseCode: 1 });
courseSchema.index({ assignedTeacher: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ department: 1 });

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function() {
  return this.capacity - this.enrolledStudents;
});

// Pre-save validation for assessment weights
courseSchema.pre('save', function(next) {
  const weights = this.assessmentWeights;
  const total = weights.attendance + weights.quizzes + weights.assignments + weights.midterm + weights.final;
  
  if (total !== 100) {
    return next(new Error(`Assessment weights must sum to 100, currently: ${total}`));
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
