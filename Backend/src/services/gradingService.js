/**
 * Grading Service - Hybrid Grading System
 * Auto-grades MCQ quizzes/in-lecture questions
 * Provides teacher grading for assignments
 * Auto-calculates attendance
 * Aggregates weighted grades safely
 */

const StudentResponse = require('../models/StudentResponse');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');
const { HTTP_STATUS } = require('../utils/constants');

class GradingService {
  /**
   * Auto-grade MCQ quiz response
   * Used for immediate grading of quiz and in-lecture questions
   * @param {Object} params - studentId, enrollmentId, quizId, questionId, selectedOptions, attemptNumber
   * @returns {Object} Graded response with score, percentage, isPassed
   */
  async autoGradeQuizResponse({
    studentId,
    enrollmentId,
    quizId,
    questionId,
    selectedOptions,
    attemptNumber = 1,
    timeSpent = 0,
  }) {
    try {
      // 1. Get quiz question details
      const question = await QuizQuestion.findById(questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      // 2. Get quiz for points and passing score
      const quiz = await Quiz.findById(quizId).populate('courseId');
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // 3. Extract correct option IDs from the options array
      // options = [{optionId: "option_0", optionText: "...", isCorrect: true}, ...]
      const correctOptionIds = question.options
        ? question.options
            .filter((opt) => opt.isCorrect === true)
            .map((opt) => opt.optionId)
        : [];

      console.log('Grading response:', {
        questionId,
        questionType: question.questionType,
        studentSelectedOptions: selectedOptions,
        correctOptionIds,
        questionOptions: question.options?.map(o => ({ id: o.optionId, isCorrect: o.isCorrect })),
      });

      // 4. Check if answer is correct
      // For MCQ: selected options must exactly match correct options
      const studentAnswersSet = new Set(selectedOptions || []);
      const correctAnswersSet = new Set(correctOptionIds);

      const isCorrect =
        studentAnswersSet.size === correctAnswersSet.size &&
        [...studentAnswersSet].every((ans) => correctAnswersSet.has(ans));

      // 5. Calculate marks awarded
      const marksAwarded = isCorrect ? (question.points || 1) : 0;
      console.log('Grading result:', { questionId, isCorrect, marksAwarded, studentSelected: selectedOptions, correctIds: correctOptionIds });

      // 6. Calculate percentage and determine if passed
      //const percentage = (marksAwarded / pointsPerQuestion) * 100;
      //const isPassed = percentage >= 50; // Threshold for individual question

      // 6. Prepare feedback
      const correctOptionTexts = question.options
        ? question.options
            .filter((opt) => opt.isCorrect === true)
            .map((opt) => opt.optionText)
        : [];

      const feedback = isCorrect
        ? `Correct! +${marksAwarded.toFixed(2)} points`
        : `Incorrect. Correct answer: ${correctOptionTexts.join(', ')}`;

      // 7. Return grading result
      // ✅ HYBRID MODEL: Service ONLY calculates, does NOT save
      return {
        isCorrect,
        marksAwarded,
        feedback
      };
    } catch (error) {
      console.error('Auto-grade quiz response error:', error);
      throw error;
    }
  }

  /**
   * Grade assignment submission (Teacher action)
   * Called when teacher submits grades for an assignment
   * @param {Object} params - submissionId, score, feedback
   * @returns {Object} Graded submission record
   */
  async gradeAssignment({ submissionId, score, feedback }) {
    try {
      // 1. Validate score range
      if (score < 0 || score > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      // 2. Get submission
      const submission = await StudentResponse.findById(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // 3. Verify submission is in submitted state
      if (submission.status !== 'submitted') {
        throw new Error('Can only grade submitted assignments');
      }

      // 4. Calculate percentage
      const percentage = (score / 100) * 100; // Normalized to 100

      // 5. Determine if passed (typically 50% for assignments)
      const isPassed = percentage >= 50;

      // 6. Update submission with grade
      submission.status = 'graded';
      submission.score = score;
      submission.percentage = percentage;
      submission.isPassed = isPassed;
      submission.feedback = feedback;
      submission.gradedAt = new Date();
      submission.marksAwarded = score; // Store as marks
      submission.totalMarks = 100;

      await submission.save();

      return {
        success: true,
        submission_id: submission._id,
        status: 'graded',
        score,
        percentage,
        isPassed,
        feedback,
        gradedAt: submission.gradedAt,
      };
    } catch (error) {
      console.error('Grade assignment error:', error);
      throw error;
    }
  }

  /**
   * Calculate attendance percentage for a student
   * Based on Attendance records and lecture count
   * @param {ObjectId} studentId - Student ID
   * @param {ObjectId} courseId - Course ID
   * @returns {Number} Attendance percentage (0-100)
   */
  async calculateAttendancePercentage(studentId, courseId) {
    try {
      // 1. Get total lectures in course
      const totalLectures = await Lecture.countDocuments({ courseId });

      if (totalLectures === 0) {
        return 0; // No lectures, no attendance
      }

      // 2. Get attended lectures
      const attendedLectures = await AttendanceRecord.countDocuments({
        studentId,
        courseId,
        status: 'present',
      });

      // 3. Calculate percentage
      const attendancePercentage = (attendedLectures / totalLectures) * 100;

      return Math.min(100, Math.max(0, attendancePercentage)); // Clamp 0-100
    } catch (error) {
      console.error('Calculate attendance error:', error);
      return 0;
    }
  }

  /**
   * Calculate course grade safely with weighted aggregation
   * Only includes graded components, applies weights dynamically
   * @param {ObjectId} studentId - Student ID
   * @param {ObjectId} courseId - Course ID
   * @returns {Object} Grade object with all components and final score
   */
  async calculateCourseGrade(studentId, courseId) {
    try {
      // 1. Get course to retrieve weights
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // 2. Get enrollment for context
      const enrollment = await Enrollment.findOne({ studentId, courseId });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // 3. Get default weights from course (fallback)
      const weights = course.assessmentWeights || {
        quizzes: 20,
        assignments: 20,
        attendance: 10,
        lectures: 25,
        examinations: 25,
      };

      // 4. Collect graded quiz scores
      const quizResponses = await StudentResponse.find({
        studentId,
        courseId,
        responseType: 'quiz',
        status: 'graded',
      });

      let quizScore = 0;
      let hasQuizGrades = false;

      if (quizResponses.length > 0) {
        const totalQuizMarks = quizResponses.reduce(
          (sum, r) => sum + r.marksAwarded,
          0
        );
        const maxQuizMarks = quizResponses.reduce(
          (sum, r) => sum + r.totalMarks,
          0
        );
        quizScore =
          maxQuizMarks > 0 ? (totalQuizMarks / maxQuizMarks) * 100 : 0;
        hasQuizGrades = true;
      }

      // 5. Collect graded assignment scores
      const assignmentResponses = await StudentResponse.find({
        studentId,
        courseId,
        responseType: 'assignment',
        status: 'graded',
      });

      let assignmentScore = 0;
      let hasAssignmentGrades = false;

      if (assignmentResponses.length > 0) {
        const avgAssignmentScore =
          assignmentResponses.reduce((sum, r) => sum + r.score, 0) /
          assignmentResponses.length;
        assignmentScore = avgAssignmentScore;
        hasAssignmentGrades = true;
      }

      // 6. Get attendance percentage
      const attendancePercentage = await this.calculateAttendancePercentage(
        studentId,
        courseId
      );
      const hasAttendanceData = attendancePercentage > 0;

      // 7. Get lecture participation score (from activity logs)
      // For now, use a placeholder - implement as needed
      const lectureScore = 0;
      const hasLectureGrades = false;

      // 8. Safe weighted aggregation
      // Only include components that have grades
      let totalWeightUsed = 0;
      let weightedSum = 0;

      if (hasQuizGrades) {
        weightedSum += quizScore * weights.quizzes;
        totalWeightUsed += weights.quizzes;
      }

      if (hasAssignmentGrades) {
        weightedSum += assignmentScore * weights.assignments;
        totalWeightUsed += weights.assignments;
      }

      if (hasAttendanceData) {
        weightedSum += attendancePercentage * weights.attendance;
        totalWeightUsed += weights.attendance;
      }

      if (hasLectureGrades) {
        weightedSum += lectureScore * weights.lectures;
        totalWeightUsed += weights.lectures;
      }

      // 9. Calculate final score (normalize by actual weight used)
      const finalScore =
        totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0;

      // 10. Convert to letter grade
      const letterGrade = this.calculateLetterGrade(finalScore);

      // 11. Calculate GPA (4.0 scale)
      const gpa = this.calculateGPA(letterGrade);

      // 12. Prepare component grades
      const componentGrades = {
        quizzes: hasQuizGrades ? parseFloat(quizScore.toFixed(2)) : 0,
        assignments: hasAssignmentGrades
          ? parseFloat(assignmentScore.toFixed(2))
          : 0,
        attendance: hasAttendanceData
          ? parseFloat(attendancePercentage.toFixed(2))
          : 0,
        lectures: hasLectureGrades ? parseFloat(lectureScore.toFixed(2)) : 0,
        examinations: 0, // Reserved for future use
      };

      // 13. Create or update Grade record
      const gradeRecord = await Grade.findOneAndUpdate(
        { enrollmentId: enrollment._id, studentId, courseId },
        {
          enrollmentId: enrollment._id,
          studentId,
          courseId,
          componentGrades,
          finalScore: parseFloat(finalScore.toFixed(2)),
          letterGrade,
          gpa: parseFloat(gpa.toFixed(2)),
          status: this.determineGradeStatus(finalScore, hasQuizGrades, hasAssignmentGrades),
          calculatedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return {
        success: true,
        grade: {
          enrollment_id: enrollment._id,
          student_id: studentId,
          course_id: courseId,
          component_grades: componentGrades,
          final_score: parseFloat(finalScore.toFixed(2)),
          letter_grade: letterGrade,
          gpa: parseFloat(gpa.toFixed(2)),
          status: gradeRecord.status,
          calculated_at: gradeRecord.calculatedAt,
        },
      };
    } catch (error) {
      console.error('Calculate course grade error:', error);
      throw error;
    }
  }

  /**
   * Convert numeric score to letter grade
   * A: 90-100, B: 80-89, C: 70-79, D: 60-69, F: 0-59
   */
  calculateLetterGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Convert letter grade to GPA (4.0 scale)
   * A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0
   */
  calculateGPA(letterGrade) {
    const gpaMap = {
      A: 4.0,
      B: 3.0,
      C: 2.0,
      D: 1.0,
      F: 0.0,
    };
    return gpaMap[letterGrade] || 0;
  }

  /**
   * Determine grade status based on what's been graded
   */
  determineGradeStatus(finalScore, hasQuizzes, hasAssignments) {
    // If no graded items, status is incomplete
    if (!hasQuizzes && !hasAssignments) {
      return 'incomplete';
    }
    // If partial grades, status is in_progress
    if (hasQuizzes && !hasAssignments) {
      return 'in_progress';
    }
    if (!hasQuizzes && hasAssignments) {
      return 'in_progress';
    }
    // If all graded, status is in_progress (becomes final at course end)
    return 'in_progress';
  }

  /**
   * Get current quiz aggregate score for a student
   * Useful for dashboard display before final grade
   */
  async getQuizAggregate(studentId, courseId) {
    try {
      const quizResponses = await StudentResponse.find({
        studentId,
        courseId,
        responseType: 'quiz',
        status: 'graded',
      });

      if (quizResponses.length === 0) {
        return { average: 0, total_questions: 0, correct: 0 };
      }

      const totalMarks = quizResponses.reduce(
        (sum, r) => sum + r.marksAwarded,
        0
      );
      const maxMarks = quizResponses.reduce(
        (sum, r) => sum + r.totalMarks,
        0
      );
      const correct = quizResponses.filter((r) => r.isCorrect).length;

      return {
        average: maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0,
        total_questions: quizResponses.length,
        correct,
        score: totalMarks,
        max_score: maxMarks,
      };
    } catch (error) {
      console.error('Get quiz aggregate error:', error);
      return { average: 0, total_questions: 0, correct: 0 };
    }
  }

  /**
   * Get pending grading count for teacher
   * Used for dashboard display
   */
  async getPendingGradingCount(teacherId, courseId) {
    try {
      // Find all submitted assignments waiting for grades
      const submissions = await StudentResponse.countDocuments({
        courseId,
        responseType: 'assignment',
        status: 'submitted',
      });

      return submissions;
    } catch (error) {
      console.error('Get pending grading count error:', error);
      return 0;
    }
  }
}

module.exports = new GradingService();
