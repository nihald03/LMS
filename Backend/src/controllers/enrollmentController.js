const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// @desc    Enroll student in course
// @route   POST /api/enrollments
// @access  Private (Student)
exports.enrollStudent = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide courseId',
          ['courseId']
        )
      );
    }

    // Get student
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Student profile not found',
          []
        )
      );
    }

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Course not found',
          []
        )
      );
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId,
    });

    if (existingEnrollment) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        createErrorResponse(
          HTTP_STATUS.CONFLICT,
          'Already enrolled in this course',
          ['courseId']
        )
      );
    }

    // Check capacity
    if (course.enrolledStudents >= course.capacity) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Course is full. No seats available',
          ['capacity']
        )
      );
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: req.user._id,
      courseId,
      enrollmentDate: new Date(),
      status: 'active',
    });

    // Update course enrollment count
    course.enrolledStudents += 1;
    course.enrolledStudentsList.push(student._id);
    await course.save();

    // Update student's enrolled courses
    student.enrolledCourses.push(courseId);
    await student.save();

    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'Enrolled in course successfully', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Enroll student error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to enroll in course',
        [error.message]
      )
    );
  }
};

// @desc    Get student's enrolled courses
// @route   GET /api/enrollments/student/:studentId
// @access  Private
exports.getStudentCourses = async (req, res) => {
  try {
    const { studentId } = req.params;

    const enrollments = await Enrollment.find({ studentId, status: 'active' })
      .populate('courseId', 'courseCode courseName credits semester');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Student courses retrieved successfully', {
        enrollments,
        count: enrollments.length,
      })
    );
  } catch (error) {
    console.error('Get student courses error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve student courses',
        [error.message]
      )
    );
  }
};

// @desc    Get course students (for teacher)
// @route   GET /api/enrollments/course/:courseId
// @access  Private (Teacher)
exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ courseId, status: 'active' })
      .populate('studentId', 'userId studentId enrollmentDate');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course students retrieved successfully', {
        enrollments,
        count: enrollments.length,
      })
    );
  } catch (error) {
    console.error('Get course students error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve course students',
        [error.message]
      )
    );
  }
};

// @desc    Drop course
// @route   DELETE /api/enrollments/:enrollmentId
// @access  Private (Student)
exports.dropCourse = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      { status: 'dropped' },
      { new: true }
    );

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Enrollment not found',
          []
        )
      );
    }

    // Update course enrollment count
    const course = await Course.findById(enrollment.courseId);
    if (course && course.enrolledStudents > 0) {
      course.enrolledStudents -= 1;
      course.enrolledStudentsList = course.enrolledStudentsList.filter(
        (id) => id.toString() !== enrollment.studentId.toString()
      );
      await course.save();
    }

    // Remove from student's enrolled courses
    const student = await Student.findById(enrollment.studentId);
    if (student) {
      student.enrolledCourses = student.enrolledCourses.filter(
        (id) => id.toString() !== enrollment.courseId.toString()
      );
      await student.save();
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course dropped successfully', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Drop course error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to drop course',
        [error.message]
      )
    );
  }
};

// @desc    Update student marks
// @route   PUT /api/enrollments/:enrollmentId/marks
// @access  Private (Teacher)
exports.updateMarks = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { attendance, quizzes, assignments, midterm, final } = req.body;

    // Validate marks are between 0-100
    const marks = { attendance, quizzes, assignments, midterm, final };
    for (const [key, value] of Object.entries(marks)) {
      if (value !== undefined && (value < 0 || value > 100)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
          createErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            `${key} must be between 0 and 100`,
            [key]
          )
        );
      }
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      {
        'marks.attendance': attendance !== undefined ? attendance : undefined,
        'marks.quizzes': quizzes !== undefined ? quizzes : undefined,
        'marks.assignments': assignments !== undefined ? assignments : undefined,
        'marks.midterm': midterm !== undefined ? midterm : undefined,
        'marks.final': final !== undefined ? final : undefined,
      },
      { new: true, runValidators: true }
    ).populate('courseId', 'assessmentWeights');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Enrollment not found',
          []
        )
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Marks updated successfully', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Update marks error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to update marks',
        [error.message]
      )
    );
  }
};

// @desc    Submit grades for course
// @route   PUT /api/enrollments/:enrollmentId/submit-grade
// @access  Private (Teacher)
exports.submitGrade = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Enrollment not found',
          []
        )
      );
    }

    // Validate all marks are entered
    const { marks } = enrollment;
    if (
      marks.attendance === undefined ||
      marks.quizzes === undefined ||
      marks.assignments === undefined ||
      marks.midterm === undefined ||
      marks.final === undefined
    ) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'All marks must be entered before submitting grades',
          ['marks']
        )
      );
    }

    // Marks should already be calculated and grade assigned via pre-save hook
    enrollment.status = 'completed';
    await enrollment.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Grade submitted successfully', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Submit grade error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to submit grade',
        [error.message]
      )
    );
  }
};

// @desc    Get enrollment by ID
// @route   GET /api/enrollments/:enrollmentId
// @access  Private
exports.getEnrollmentById = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('studentId', 'userId studentId')
      .populate('courseId', 'courseCode courseName assessmentWeights');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Enrollment not found',
          []
        )
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Enrollment retrieved successfully', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Get enrollment error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve enrollment',
        [error.message]
      )
    );
  }
};

// @desc    Get enrollment statistics
// @route   GET /api/enrollments/stats/:enrollmentId
// @access  Private
exports.getEnrollmentStats = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('courseId', 'assessmentWeights');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Enrollment not found',
          []
        )
      );
    }

    const { marks, totalMarks, grade, gpa } = enrollment;
    const weights = enrollment.courseId.assessmentWeights;

    const stats = {
      marks,
      totalMarks: Math.round(totalMarks * 100) / 100,
      grade,
      gpa: Math.round(gpa * 100) / 100,
      weights,
      breakdown: {
        attendance: `${marks.attendance}/100 (${weights.attendance}%)`,
        quizzes: `${marks.quizzes}/100 (${weights.quizzes}%)`,
        assignments: `${marks.assignments}/100 (${weights.assignments}%)`,
        midterm: `${marks.midterm}/100 (${weights.midterm}%)`,
        final: `${marks.final}/100 (${weights.final}%)`,
      },
    };

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Enrollment stats retrieved successfully', {
        stats,
      })
    );
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve enrollment stats',
        [error.message]
      )
    );
  }
};

// @desc    Get student's enrollments
// @route   GET /api/enrollments/my-enrollments
// @access  Private (Student)
exports.getStudentEnrollments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    const enrollments = await Enrollment.find({ studentId: req.user._id })
      .populate('courseId', 'courseName courseCode semester')
      .sort({ enrollmentDate: -1 });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Enrollments retrieved successfully', {
        enrollments,
        count: enrollments.length,
      })
    );
  } catch (error) {
    console.error('Get student enrollments error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve enrollments',
        [error.message]
      )
    );
  }
};

// @desc    Get enrollment by ID
// @route   GET /api/enrollments/:enrollmentId
// @access  Private
exports.getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('studentId', 'userId studentId')
      .populate('courseId', 'courseName courseCode');

    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Enrollment not found', [])
      );
    }

// ADMIN or TEACHER can view any enrollment
if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.TEACHER) {
  return res.status(HTTP_STATUS.OK).json(
    createSuccessResponse(
      HTTP_STATUS.OK,
      'Enrollment details retrieved',
      { enrollment }
    )
  );
}

// STUDENT can view only their own enrollment
const student = await Student.findOne({ userId: req.user._id });

if (!student || enrollment.studentId.toString() !== student._id.toString()) {
  return res.status(HTTP_STATUS.FORBIDDEN).json(
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      'Not authorized to view this enrollment',
      []
    )
  );
}

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Enrollment details retrieved', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Get enrollment details error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve enrollment',
        [error.message]
      )
    );
  }
};

// @desc    Get course enrollments (for teacher)
// @route   GET /api/enrollments/course/:courseId/students
// @access  Private (Teacher/Admin)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

// Verify teacher owns course (if teacher)
if (req.user.role === ROLES.TEACHER) {
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Teacher profile not found',
        []
      )
    );
  }

  const course = await Course.findById(courseId);

  if (
    !course ||
    course.assignedTeacher.toString() !== teacher._id.toString()
  ) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Not authorized to view this course enrollments',
        []
      )
    );
  }
}


    const enrollments = await Enrollment.find({ courseId })
      .populate('studentId', 'userId studentId')
      .sort({ enrollmentDate: -1 });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course enrollments retrieved', {
        enrollments,
        count: enrollments.length,
      })
    );
  } catch (error) {
    console.error('Get course enrollments error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve course enrollments',
        [error.message]
      )
    );
  }
};

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:enrollmentId/status
// @access  Private (Teacher/Admin)
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Please provide status', ['status'])
      );
    }

    const validStatuses = ['active', 'dropped', 'completed', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          `Status must be one of: ${validStatuses.join(', ')}`,
          ['status']
        )
      );
    }

    const enrollment = await Enrollment.findById(enrollmentId).populate('courseId');
    if (!enrollment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Enrollment not found', [])
      );
    }

// Verify authorization
if (req.user.role === ROLES.TEACHER) {
  const teacher = await Teacher.findOne({ userId: req.user._id });

  if (!teacher) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Teacher profile not found',
        []
      )
    );
  }

  if (
    enrollment.courseId.assignedTeacher.toString() !== teacher._id.toString()
  ) {
    return res.status(HTTP_STATUS.FORBIDDEN).json(
      createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'Not authorized to update this enrollment',
        []
      )
    );
  }
}

    enrollment.status = status;
    await enrollment.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Enrollment status updated', {
        enrollment,
      })
    );
  } catch (error) {
    console.error('Update enrollment status error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to update enrollment status',
        [error.message]
      )
    );
  }
};
