const mongoose = require('mongoose');

/**
 * AttendanceConfig Model
 * 
 * Stores attendance calculation configuration per course
 * - Weights for different attendance sources (lecture, quiz, assignment)
 * - Attendance threshold for defaulter status
 * - Calculation method (equal weighting by default)
 */
const attendanceConfigSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      unique: true,
      index: true,
    },
    
    // Weights for different attendance sources (must sum to 100)
    weights: {
      lecture: {
        type: Number,
        default: 33.33,
        min: [0, 'Lecture weight cannot be negative'],
        max: [100, 'Lecture weight cannot exceed 100'],
      },
      quiz: {
        type: Number,
        default: 33.33,
        min: [0, 'Quiz weight cannot be negative'],
        max: [100, 'Quiz weight cannot exceed 100'],
      },
      assignment: {
        type: Number,
        default: 33.34,
        min: [0, 'Assignment weight cannot be negative'],
        max: [100, 'Assignment weight cannot exceed 100'],
      },
    },
    
    // Attendance threshold for defaulter status (%)
    defaulterThreshold: {
      type: Number,
      default: 75,
      min: [0, 'Threshold cannot be less than 0'],
      max: [100, 'Threshold cannot exceed 100'],
    },
    
    // Whether to track each source separately
    trackSeparately: {
      type: Boolean,
      default: true,
    },
    
    // Calculation method: 'weighted', 'average', 'minimum'
    calculationMethod: {
      type: String,
      enum: ['weighted', 'average', 'minimum'],
      default: 'weighted',
    },
    
    // Include lectures in attendance calculation
    includeLectures: {
      type: Boolean,
      default: true,
    },
    
    // Include quizzes in attendance calculation
    includeQuizzes: {
      type: Boolean,
      default: false,
    },
    
    // Include assignments in attendance calculation
    includeAssignments: {
      type: Boolean,
      default: false,
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

// Pre-save validation: weights should sum to approximately 100
attendanceConfigSchema.pre('save', function(next) {
  const { lecture, quiz, assignment } = this.weights;
  const total = lecture + quiz + assignment;
  
  // Allow small floating point variations
  if (Math.abs(total - 100) > 0.01) {
    // Auto-normalize to sum to 100
    const normalizedTotal = total;
    if (normalizedTotal > 0) {
      this.weights.lecture = (lecture / normalizedTotal) * 100;
      this.weights.quiz = (quiz / normalizedTotal) * 100;
      this.weights.assignment = (assignment / normalizedTotal) * 100;
    }
  }
  
  next();
});

const AttendanceConfig = mongoose.model('AttendanceConfig', attendanceConfigSchema);

module.exports = AttendanceConfig;
