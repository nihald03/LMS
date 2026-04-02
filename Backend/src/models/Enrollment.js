const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide student ID'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Please provide course ID'],
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'dropped', 'completed', 'suspended'],
      default: 'active',
    },
    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', null],
      default: null,
    },
    gpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },
    marks: {
      attendance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      quizzes: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      assignments: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      midterm: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      final: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    submissions: {
      assignments: {
        type: Number,
        default: 0,
      },
      quizzes: {
        type: Number,
        default: 0,
      },
    },
    viewedLectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture',
      },
    ],
    notes: String,
    droppedDate: Date,
    completionDate: Date,
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

// Unique constraint: one student per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// Other indexes for faster queries
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });

// Pre-save hook to calculate total marks
enrollmentSchema.pre('save', function (next) {
  if (this.isModified('marks')) {
    // Assuming weights from course are: attendance: 10%, quizzes: 20%, assignments: 20%, midterm: 25%, final: 25%
    const total =
      (this.marks.attendance * 0.10) +
      (this.marks.quizzes * 0.20) +
      (this.marks.assignments * 0.20) +
      (this.marks.midterm * 0.25) +
      (this.marks.final * 0.25);

    this.totalMarks = Math.round(total * 100) / 100;

    // Assign grade based on total marks
    if (this.totalMarks >= 90) this.grade = 'A+';
    else if (this.totalMarks >= 85) this.grade = 'A';
    else if (this.totalMarks >= 80) this.grade = 'A-';
    else if (this.totalMarks >= 75) this.grade = 'B+';
    else if (this.totalMarks >= 70) this.grade = 'B';
    else if (this.totalMarks >= 65) this.grade = 'B-';
    else if (this.totalMarks >= 60) this.grade = 'C+';
    else if (this.totalMarks >= 55) this.grade = 'C';
    else if (this.totalMarks >= 50) this.grade = 'C-';
    else if (this.totalMarks >= 45) this.grade = 'D+';
    else if (this.totalMarks >= 40) this.grade = 'D';
    else this.grade = 'F';

    // Calculate GPA (A+ = 4.0, A = 3.9, etc.)
    const gradePoints = {
      'A+': 4.0,
      'A': 3.9,
      'A-': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'B-': 2.7,
      'C+': 2.3,
      'C': 2.0,
      'C-': 1.7,
      'D+': 1.3,
      'D': 1.0,
      'F': 0.0,
    };

    this.gpa = gradePoints[this.grade] || 0;
  }

  next();
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
