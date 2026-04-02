/**
 * Grade Model - Store student grades and GPA
 */

const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
    index: true
  },
  
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  // Component grades breakdown
  componentGrades: {
    quizzes: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    assignments: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    attendance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lectures: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    examinations: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Final calculated score (0-100)
  finalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    index: true
  },
  
  // Letter grade (A, B, C, D, F)
  letterGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true,
    index: true
  },
  
  // GPA equivalent (0-4.0)
  gpa: {
    type: Number,
    default : 0,
    min: 0,
    max: 4.0
  },
  
  // Status (in_progress, final)
  status: {
    type: String,
    enum: ['in_progress', 'final', 'incomplete'],
    default: 'in_progress'
  },
  
  // When grade was calculated
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // When grade was finalized
  finalizedAt: {
    type: Date
  },
  
  // Comments from teacher
  comments: {
    type: String,
    default: null
  },
  
  // Whether student passed
  passed: {
    type: Boolean,
    default: true
  },
  
  // Improvement notes
  improvementAreas: {
    type: [String],
    default: []
  }
}, {
  timestamps: true,
  strict: true
});

// Index for common queries
gradeSchema.index({ enrollmentId: 1, courseId: 1 });
gradeSchema.index({ studentId: 1, courseId: 1 });
gradeSchema.index({ courseId: 1, finalScore: 1 });
gradeSchema.index({ studentId: 1, createdAt: -1 });

// Update parent enrollment's grade reference
gradeSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('finalScore')) {
    const Enrollment = mongoose.model('Enrollment');
    await Enrollment.findByIdAndUpdate(
      this.enrollmentId,
      {
        currentGrade: this.finalScore,
        letterGrade: this.letterGrade,
        gpa: this.gpa
      }
    );
  }
  next();
});

// Virtual for semester info
gradeSchema.virtual('semester').get(async function() {
  if (this.populated('courseId')) {
    return this.courseId.semester;
  }
  const course = await mongoose.model('Course').findById(this.courseId);
  return course ? course.semester : null;
});

module.exports = mongoose.model('Grade', gradeSchema);
