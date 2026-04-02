const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Announcement = require('../models/Announcement');
const InLectureQuestion = require('../models/InLectureQuestion');
const ActivityLog = require('../models/ActivityLog');
const Student = require('../models/Student');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// @desc    Get student's enrolled courses
// @route   GET /api/students/courses
// @access  Private (Student)
exports.getStudentCourses = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

      const enrollments = await Enrollment.find({
        studentId: req.user._id,
        status: { $in: ['active', 'completed'] },
      })
      .populate({
        path: 'courseId',
        select: 'courseName courseCode semester credits description assignedTeacher',
        populate: {
          path: 'assignedTeacher',
          select: 'name email',
        },
      })
      .lean();

      const courses = enrollments.map((enrollment) => ({
        ...enrollment.courseId,
        enrollmentId: enrollment._id,
        enrollmentStatus: enrollment.status,
        enrollmentDate: enrollment.enrollmentDate,
        grade: enrollment.grade,
        marks: enrollment.marks,
    }));

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Courses retrieved successfully', {
        courses,
        total: courses.length,
      })
    );
  } catch (error) {
    console.error('Get student courses error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching courses',
        []
      )
    );
  }
};

// @desc    Get course details for enrolled student
// @route   GET /api/students/courses/:courseId
// @access  Private (Student)
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const mongoose = require('mongoose');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment with explicit ObjectId conversion
   const enrollment = await Enrollment.findOne({
    studentId: req.user._id,   // ✅ FIXED
    courseId: courseId,
    status: { $in: ['active', 'completed'] },
  });

    if (!enrollment) {
      // Debug: Log enrollment details for troubleshooting
      console.log('Enrollment verification failed:', {
        studentId: student._id,
        courseId,
        student: student.studentId,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    const course = await Course.findById(courseId)
      .populate('assignedTeacher', 'name email department')
      .lean();

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found', [])
      );
    }

    // Get course content count
    const lectureCount = await Lecture.countDocuments({ courseId });
    const assignmentCount = await Assignment.countDocuments({ courseId });
    const quizCount = await Quiz.countDocuments({ courseId });
    const announcementCount = await Announcement.countDocuments({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Course details retrieved', {
        course: {
          ...course,
          contentCount: {
            lectures: lectureCount,
            assignments: assignmentCount,
            quizzes: quizCount,
            announcements: announcementCount,
          },
          enrollmentStatus: enrollment.status,
          currentGrade: enrollment.grade,
          attendancePercentage: enrollment.attendancePercentage,
        },
      })
    );
  } catch (error) {
    console.error('Get course details error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching course details',
        []
      )
    );
  }
};

// @desc    View lecture (with access verification)
// @route   GET /api/students/lectures/:lectureId
// @access  Private (Student)
exports.viewLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId)
      .populate('courseId', 'courseName')
      .populate('createdBy', 'name')
      .lean();

    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found', [])
      );
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: lecture.courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    // Log activity
    await ActivityLog.create({
      studentId: student._id,
      courseId: lecture.courseId._id,
      action: 'viewed_lecture',
      lectureId,
      timestamp: new Date(),
    });
    const activityLogService = require('../services/activityLogService');

try {
  await activityLogService.logActivity({
    studentId: student._id,
    courseId: lecture.courseId._id,
    activityType: 'lecture_end',
    activityData: {
      lectureId: lecture._id,
      lectureTitle: lecture.title,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  console.log("✅ NEW ACTIVITY LOG CREATED");
} catch (err) {
  console.error("❌ NEW LOG ERROR:", err.message);
}
    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lecture retrieved successfully', {
        lecture,
      })
    );
  } catch (error) {
    console.error('View lecture error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching lecture',
        []
      )
    );
  }
};

// @desc    Get lectures for enrolled course
// @route   GET /api/students/courses/:courseId/lectures
// @access  Private (Student)
exports.getCourseLectures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const mongoose = require('mongoose');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment with explicit ObjectId conversion
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      console.log('Enrollment verification failed for lectures:', {
        studentId: student._id,
        courseId,
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    const skip = (page - 1) * limit;

    const lectures = await Lecture.find({ courseId })
      .select('title description dateScheduled duration createdBy')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dateScheduled: -1 })
      .lean();

    const total = await Lecture.countDocuments({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lectures retrieved successfully', {
        lectures,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get course lectures error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching lectures',
        []
      )
    );
  }
};

// @desc    Get assignments for enrolled course
// @route   GET /api/students/courses/:courseId/assignments
// @access  Private (Student)
exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const mongoose = require('mongoose');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment with explicit ObjectId conversion
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    const skip = (page - 1) * limit;

    const assignments = await Assignment.find({ courseId })
      .select('title description dueDate maxScore createdBy')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: 1 })
      .lean();

    const total = await Assignment.countDocuments({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Assignments retrieved successfully', {
        assignments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get course assignments error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching assignments',
        []
      )
    );
  }
};

// @desc    Get quizzes for enrolled course
// @route   GET /api/students/courses/:courseId/quizzes
// @access  Private (Student)
exports.getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const mongoose = require('mongoose');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment with explicit ObjectId conversion
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    const skip = (page - 1) * limit;

    const quizzes = await Quiz.find({ courseId })
      .select('title description totalQuestions duration maxScore createdBy')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Quiz.countDocuments({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Quizzes retrieved successfully', {
        quizzes,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get course quizzes error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching quizzes',
        []
      )
    );
  }
};

// @desc    Get announcements for enrolled course
// @route   GET /api/students/courses/:courseId/announcements
// @access  Private (Student)
exports.getCourseAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const mongoose = require('mongoose');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment with explicit ObjectId conversion
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    const skip = (page - 1) * limit;

    const announcements = await Announcement.find({ courseId })
      .select('title message createdBy postedDate')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ postedDate: -1 })
      .lean();

    const total = await Announcement.countDocuments({ courseId });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcements retrieved successfully', {
        announcements,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get course announcements error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching announcements',
        []
      )
    );
  }
};

// @desc    Get in-lecture questions for a lecture
// @route   GET /api/students/lectures/:lectureId/questions
// @access  Private (Student)
exports.getLectureQuestions = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // 1. Find lecture
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found', [])
      );
    }

    // 2. Find logged-in student
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // 3. Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: lecture.courseId,
      status: { $in: ['active', 'completed'] },
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    // 4. Fetch in-lecture questions (✅ MATCHES YOUR MODEL)
const mongoose = require('mongoose');

const questions = await InLectureQuestion.find({
  lectureId: new mongoose.Types.ObjectId(lectureId)
})
  .sort({ timeMarker: 1 })
  .lean();

console.log("🔥 BACKEND QUESTIONS:", JSON.stringify(questions, null, 2));

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(
        HTTP_STATUS.OK,
        'Questions retrieved successfully',
        {
          questions,
          total: questions.length,
        }
      )
    );
  } catch (error) {
    console.error('Get lecture questions error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching questions',
        []
      )
    );
  }
};


// @desc    Get student's activity log
// @route   GET /api/students/activity-log
// @access  Private (Student)
exports.getActivityLog = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    const skip = (page - 1) * limit;
    let query = { studentId: student._id };

    if (courseId) {
      query.courseId = courseId;
    }

    const activityLog = await ActivityLog.find(query)
      .populate('courseId', 'courseName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 })
      .lean();

    const total = await ActivityLog.countDocuments(query);

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Activity log retrieved successfully', {
        activityLog,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get activity log error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error fetching activity log',
        []
      )
    );
  }
};

// @desc    Track lecture view
// @route   POST /api/students/lectures/:lectureId/track-view
// @access  Private (Student)
exports.trackLectureView = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const mongoose = require('mongoose');

    console.log('=== TRACK LECTURE VIEW START ===');
    console.log('Lecture ID:', lectureId);
    console.log('User ID:', req.user._id);

    const lecture = await Lecture.findById(lectureId);
    console.log('Lecture found:', !!lecture);
    
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found', [])
      );
    }

    const student = await Student.findOne({ userId: req.user._id });
    console.log('Student found:', !!student, student?._id);
    
    if (!student) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Student profile not found', [])
      );
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,   // ✅ FIXED
      courseId: lecture.courseId,
      status: { $in: ['active', 'completed'] },
    });

    console.log('Enrollment found:', !!enrollment);
    console.log('Enrollment data:', {
      studentId: enrollment?.studentId,
      courseId: enrollment?.courseId,
      status: enrollment?.status,
      hasViewedLectures: !!enrollment?.viewedLectures,
      hasMarks: !!enrollment?.marks
    });

    if (!enrollment) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You are not enrolled in this course',
          []
        )
      );
    }

    // 1. Update Enrollment viewedLectures (Unique)
    if (!enrollment.viewedLectures) {
      console.log('Initializing viewedLectures array');
      enrollment.viewedLectures = [];
    }

    const isAlreadyViewed = enrollment.viewedLectures.some(
      (id) => id.toString() === lectureId.toString()
    );

    if (!isAlreadyViewed) {
      enrollment.viewedLectures.push(lectureId);

      // 2. Count total lectures for course
      const totalLecturesCount = await mongoose.model('Lecture').countDocuments({
        courseId: lecture.courseId
      });

      if (totalLecturesCount > 0) {
        const progress = (enrollment.viewedLectures.length / totalLecturesCount) * 100;
        enrollment.attendancePercentage = Math.round(progress * 100) / 100;

        // Also update marks.attendance for grading consistency
        if (!enrollment.marks) {
          console.log('Initializing marks object');
          enrollment.marks = {};
        }
        enrollment.marks.attendance = enrollment.attendancePercentage;
      }

      await enrollment.save();
    }

    // Log activity
    const activity = await ActivityLog.create({
      studentId: student._id,
      courseId: lecture.courseId,
      action: 'viewed_lecture',
      lectureId,
      timestamp: new Date(),
    });

    console.log('Activity logged:', !!activity);
    console.log('=== TRACK LECTURE VIEW END ===');

    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'Lecture view tracked and progress updated', {
        activity,
        progress: enrollment.attendancePercentage
      })
    );
  } catch (error) {
    console.error('=== TRACK LECTURE VIEW ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Error tracking lecture view: ' + error.message,
        []
      )
    );
  }
};
