const Lecture = require('../models/Lecture');
const Course = require('../models/Course');
const InLectureQuestion = require('../models/InLectureQuestion');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// @desc    Create a new lecture
// @route   POST /api/lectures
// @access  Private (Teacher/Admin)

exports.createLecture = async (req, res) => {

  try {
    const { courseId, title, description, lectureNumber, duration, materials, videoUrl, scheduledDate } = req.body;

    // Validate required fields
    if (!courseId || !title || lectureNumber === undefined) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Please provide all required fields', [
          'courseId',
          'title',
          'lectureNumber',
        ])
      );
    }

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found', ['courseId'])
      );
    }

// Check if course has assigned teacher and userId
// Fetch teacher linked to the course
const isTeacher = courseExists.assignedTeacher.toString() === req.user._id.toString();
const isAdmin = req.user.role === ROLES.ADMIN;

if (!isTeacher && !isAdmin) {
  return res.status(HTTP_STATUS.FORBIDDEN).json(
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      'You do not have permission to create lectures for this course'
    )
  );
} 

    // Check if lecture number already exists for this course
    const lectureExists = await Lecture.findOne({ courseId, lectureNumber });
    if (lectureExists) {
      return res.status(HTTP_STATUS.CONFLICT).json(
        createErrorResponse(HTTP_STATUS.CONFLICT, 'Lecture with this number already exists for this course')
      );
    }

    const lecture = new Lecture({
      courseId,
      title,
      description,
      lectureNumber,
      duration: duration || 60,
      materials: materials || [],
      videoUrl,
      scheduledDate,
      createdBy:  req.user._id,
    });

    await lecture.save();
    const activityLogService = require('../services/activityLogService');


    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'Lecture created successfully', lecture)
    );
  } catch (error) {
    console.error('Error creating lecture:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get all lectures for a course
// @route   GET /api/lectures/course/:courseId
// @access  Public
exports.getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
      );
    }

    const lectures = await Lecture.find({ courseId })
      .sort({ lectureNumber: 1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('inLectureQuestions');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lectures retrieved successfully', lectures)
    );
  } catch (error) {
    console.error('Error retrieving lectures:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get lecture by ID
// @route   GET /api/lectures/:lectureId
// @access  Public
exports.getLectureById = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId)
      .populate('courseId', 'courseName courseCode')
      .populate('createdBy', 'firstName lastName email')
      .populate({
        path: 'inLectureQuestions',
        populate: {
          path: 'studentResponses.studentId',
          select: 'firstName lastName email',
        },
      });

    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lecture retrieved successfully', lecture)
    );
  } catch (error) {
    console.error('Error retrieving lecture:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Update lecture
// @route   PUT /api/lectures/:lectureId
// @access  Private (Teacher/Admin)
exports.updateLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { title, description, duration, materials, videoUrl, scheduledDate, isPublished } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    // Check if user is the lecture creator or admin
    // lecture.createdBy stores User._id (backward compatibility: also supports old User IDs)
    const isCreator = req.user._id.toString() === lecture.createdBy.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    
    if (!isCreator && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to update this lecture')
      );
    }

    // Update fields
    if (title) lecture.title = title;
    if (description) lecture.description = description;
    if (duration) lecture.duration = duration;
    if (materials) lecture.materials = materials;
    if (videoUrl) lecture.videoUrl = videoUrl;
    if (scheduledDate) lecture.scheduledDate = scheduledDate;
    if (isPublished !== undefined) lecture.isPublished = isPublished;
    lecture.lastModifiedBy = req.user._id;

    await lecture.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lecture updated successfully', lecture)
    );
  } catch (error) {
    console.error('Error updating lecture:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Delete lecture
// @route   DELETE /api/lectures/:lectureId
// @access  Private (Teacher/Admin)
exports.deleteLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    // Check if user is the lecture creator or admin
    // lecture.createdBy stores User._id (backward compatibility: also supports old User IDs)
    const isCreator = req.user._id.toString() === lecture.createdBy.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    
    if (!isCreator && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to delete this lecture')
      );
    }

    // Delete associated in-lecture questions
    await InLectureQuestion.deleteMany({ lectureId });

    await Lecture.findByIdAndDelete(lectureId);

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Lecture deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting lecture:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};
// @desc    Add in-lecture question
// @route   POST /api/lectures/:lectureId/in-lecture-questions
// @access  Private (Teacher/Admin)
exports.addInLectureQuestion = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { questionText, questionType, timeMarker, options, points } = req.body;

    if (!questionText || timeMarker === undefined || !options) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(
          HTTP_STATUS.BAD_REQUEST,
          'Please provide all required fields',
          ['questionText', 'timeMarker', 'options']
        )
      );
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    // Check permission - lecture.createdBy stores User._id
    const isCreator = req.user._id.toString() === lecture.createdBy.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    
    if (!isCreator && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(
          HTTP_STATUS.FORBIDDEN,
          'You do not have permission to add questions to this lecture'
        )
      );
    }

    const question = await InLectureQuestion.create({
      lectureId,
      questionText,
      questionType: questionType || 'mcq',
      timeMarker,
      options,
      points: points || 1,
      createdBy: req.user._id,
    });

    lecture.inLectureQuestions.push(question._id);
    await lecture.save();

    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(
        HTTP_STATUS.CREATED,
        'In-lecture question added successfully',
        question
      )
    );
  } catch (error) {
    console.error('Error adding in-lecture question:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Add in-lecture question
// @route   POST /api/lectures/:lectureId/in-lecture-questions
// @access  Private (Teacher/Admin)
const respondToInLectureQuestion = async (req, res) => {
  try {
    const { lectureId, questionId } = req.params;
    const { selectedOption } = req.body;

    if (!selectedOption) {
      return res.status(400).json(
        createErrorResponse(400, 'selectedOption is required')
      );
    }

    const question = await InLectureQuestion.findOne({
      _id: questionId,
      lectureId,
    });

    if (!question) {
      return res.status(404).json(
        createErrorResponse(404, 'In-lecture question not found')
      );
    }

    // Prevent duplicate response
    const alreadyAnswered = question.studentResponses.find(
      (r) => r.studentId.toString() === req.user._id.toString()
    );

    if (alreadyAnswered) {
      return res.status(409).json(
        createErrorResponse(409, 'Question already answered')
      );
    }

    // Auto grading
    const selected = question.options.find(
      (o) => o.optionId === selectedOption
    );

    const isCorrect = selected ? selected.isCorrect : false;
    const pointsAwarded = isCorrect ? question.points : 0;

    question.studentResponses.push({
      studentId: req.user._id,
      selectedOption,
      isCorrect,
      pointsAwarded,
      answeredAt: new Date(),
      isPresent: true,
    });

    await question.save();

    return res.status(201).json(
      createSuccessResponse(201, 'Response recorded successfully', {
        isCorrect,
        pointsAwarded,
      })
    );
  } catch (error) {
    console.error('Error responding to lecture question:', error);
    return res.status(500).json(
      createErrorResponse(500, error.message)
    );
  }
};



// @desc    Mark attendance from in-lecture question
// @route   PUT /api/lectures/:lectureId/attendance
// @access  Private (Student)
exports.markAttendance = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { studentId } = req.body;

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    // Check if student already marked attendance
    const attendanceRecord = lecture.attendance.find((record) => record.studentId.toString() === studentId);

    if (attendanceRecord) {
      attendanceRecord.isPresent = true;
      attendanceRecord.attendanceMarkedAt = new Date();
    } else {
      lecture.attendance.push({
        studentId,
        isPresent: true,
        attendanceMarkedAt: new Date(),
      });
    }

    await lecture.save();
    const activityLogService = require('../services/activityLogService');

try {
  await activityLogService.logActivity({
    studentId,
    courseId: lecture.courseId,
    activityType: 'checkpoint_answer',
    activityData: {
      lectureId,
      attendanceMarked: true,
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  console.log("✅ ATTENDANCE ACTIVITY LOG CREATED");
} catch (err) {
  console.error("❌ ATTENDANCE LOG ERROR:", err.message);
}
    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Attendance marked successfully')
    );
  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get analytics for all in-lecture questions of a lecture
// @route   GET /api/lectures/:lectureId/in-lecture-questions/analytics
// @access  Private (Teacher/Admin)
exports.getLectureQuestionAnalytics = async (req, res) => {
  try {
    const { lectureId } = req.params;

    // Verify lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Lecture not found')
      );
    }

    // Verify teacher has access to this lecture
    const course = await Course.findById(lecture.courseId);
    
    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
      );
    }
    
    const isTeacher = course.assignedTeacher.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    
    if (!isTeacher && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to view this lecture analytics')
      );
    }

    // Fetch all questions for this lecture
const questions = await InLectureQuestion.find({ lectureId })
  .populate('studentResponses.studentId', 'firstName lastName')
  .select('questionText timeMarker options studentResponses points');

    if (!questions || questions.length === 0) {
      return res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(HTTP_STATUS.OK, 'No questions found for this lecture', {
          questions: [],
          totalQuestions: 0,
        })
      );
    }

    // Build analytics for each question
    const analyticsData = questions.map((question) => {
      const totalResponses = question.studentResponses.length;
      const correctCount = question.studentResponses.filter((r) => r.isCorrect).length;
      const wrongCount = totalResponses - correctCount;
      const accuracy = totalResponses > 0 ? ((correctCount / totalResponses) * 100).toFixed(2) : 0;

      return {
        questionId: question._id,
        questionText: question.questionText,
        timeMarker: question.timeMarker,
        points: question.points,
        totalResponses,
        correctCount,
        wrongCount,
        accuracy: parseFloat(accuracy),
        responses: question.studentResponses.map((response) => ({
        studentId: response.studentId
          ? {
              firstName: response.studentId.firstName,
              lastName: response.studentId.lastName,
            }
          : null,
        selectedOption: response.selectedOption,
        isCorrect: response.isCorrect,
        pointsAwarded: response.pointsAwarded,
        answeredAt: response.answeredAt,
      })),
      };
    });

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Analytics fetched successfully', {
        lectureId,
        totalQuestions: analyticsData.length,
        questions: analyticsData,
      })
    );
  } catch (error) {
    console.error('Error fetching question analytics:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};


module.exports = {
  createLecture: exports.createLecture,
  getLecturesByCourse: exports.getLecturesByCourse,
  getLectureById: exports.getLectureById,
  updateLecture: exports.updateLecture,
  deleteLecture: exports.deleteLecture,
  addInLectureQuestion: exports.addInLectureQuestion,
  markAttendance: exports.markAttendance,
  respondToInLectureQuestion,
  getLectureQuestionAnalytics: exports.getLectureQuestionAnalytics,
};
