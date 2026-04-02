const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Teacher/Admin)
exports.createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      credits,
      semester,
      capacity,
      department,
      schedule,
      prerequisites,
      syllabus,
      textbooks,
      assessmentWeights,
    } = req.body;

    // Validate required fields
    if (!courseCode || !courseName || !description || !credits || !semester || !capacity || !department) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide all required fields',
          ['courseCode', 'courseName', 'description', 'credits', 'semester', 'capacity', 'department']
        )
      );
    }

    // Check if course code already exists
    const courseExists = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (courseExists) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        createErrorResponse(
          HTTP_STATUS.CONFLICT,
          'Course code already exists',
          ['courseCode']
        )
      );
    }

    // Get teacher info
    const teacher = await Teacher.findOne({ userId: req.user._id });
    console.log("DEBUG TEACHER:", teacher);
    if (!teacher && req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Teacher profile not found',
          []
        )
      );
    }

    // Create course
    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      description,
      credits: parseInt(credits),
      semester: parseInt(semester),
      capacity: parseInt(capacity),
      department,
      schedule,
      prerequisites,
      syllabus,
      textbooks,
      assessmentWeights: assessmentWeights || {
        attendance: 10,
        quizzes: 20,
        assignments: 20,
        midterm: 25,
        final: 25,
      },
      assignedTeacher: req.user._id,
      createdBy: req.user._id,
    });

    // Update teacher's courses
    if (teacher) {
      teacher.coursesAssigned.push(course._id);
      await teacher.save();
    }

    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'Course created successfully', {
        course,
      })
    );
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to create course',
        [error.message]
      )
    );
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const { semester, department, status } = req.query;
    const filter = { status: 'active' };

    if (semester) filter.semester = parseInt(semester);
    if (department) filter.department = department;
    if (status) filter.status = status;

    const courses = await Course.find(filter)
      .populate('assignedTeacher', 'userId department')
      .populate('prerequisites', 'courseCode courseName');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Courses retrieved successfully', {
        courses,
        count: courses.length,
      })
    );
  } catch (error) {
    console.error('Get all courses error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve courses',
        [error.message]
      )
    );
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:courseId
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('assignedTeacher', 'userId department expertise')
      .populate('prerequisites', 'courseCode courseName')
      .populate('enrolledStudentsList', 'userId studentId');

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Course not found',
          []
        )
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course retrieved successfully', {
        course,
      })
    );
  } catch (error) {
    console.error('Get course error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve course',
        [error.message]
      )
    );
  }
};

// @desc    Update course
// @route   PUT /api/courses/:courseId
// @access  Private (Teacher/Admin)
exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;

    // Prevent updating certain fields
    delete updates.courseCode;
    delete updates.createdBy;
    delete updates.createdAt;

    const course = await Course.findByIdAndUpdate(
      courseId,
      updates,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Course not found',
          []
        )
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course updated successfully', {
        course,
      })
    );
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to update course',
        [error.message]
      )
    );
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:courseId
// @access  Private (Admin)
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(
          HTTP_STATUS.NOT_FOUND,
          'Course not found',
          []
        )
      );
    }

    // Remove course from enrollments
    await Enrollment.deleteMany({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course deleted successfully', {})
    );
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to delete course',
        [error.message]
      )
    );
  }
};

// @desc    Get courses by teacher
// @route   GET /api/courses/teacher/:teacherId
// @access  Private
exports.getCoursesByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const courses = await Course.find({ assignedTeacher: teacherId })
      .populate('enrolledStudentsList', 'userId studentId');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Teacher courses retrieved successfully', {
        courses,
        count: courses.length,
      })
    );
  } catch (error) {
    console.error('Get teacher courses error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve teacher courses',
        [error.message]
      )
    );
  }
};

// @desc    Get enrollment stats for course
// @route   GET /api/courses/:courseId/stats
// @access  Private
exports.getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;

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

    const enrollments = await Enrollment.find({ courseId, status: 'active' });
    const completed = await Enrollment.find({ courseId, status: 'completed' });
    const dropped = await Enrollment.find({ courseId, status: 'dropped' });

    const avgMarks = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.totalMarks, 0) / enrollments.length
      : 0;

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course stats retrieved successfully', {
        stats: {
          courseCode: course.courseCode,
          courseName: course.courseName,
          capacity: course.capacity,
          enrolled: course.enrolledStudents,
          active: enrollments.length,
          completed: completed.length,
          dropped: dropped.length,
          averageMarks: Math.round(avgMarks * 100) / 100,
          availableSeats: course.capacity - course.enrolledStudents,
        },
      })
    );
  } catch (error) {
    console.error('Get course stats error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Failed to retrieve course stats',
        [error.message]
      )
    );
  }
};
