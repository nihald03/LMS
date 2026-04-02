const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const { HTTP_STATUS, ROLES } = require('../utils/constants');
const { createErrorResponse, createSuccessResponse } = require('../utils/responseHandler');

// @desc    Create an announcement
// @route   POST /api/announcements
// @access  Private (Teacher/Admin)
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      courseId,
      title,
      content,
      priority,
      attachments,
      isPinned,
      publishDate,
      expiryDate,
      targetAudience,
      targetRecipients,
    } = req.body;

    // Validate required fields
    if (!courseId || !title || !content) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(
        createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Please provide all required fields', ['courseId', 'title', 'content'])
      );
    }

    // Check if course exists
    const courseExists = await Course.findById(courseId).populate('assignedTeacher');

    if (!courseExists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
      );
    }

    // Check if user is the course teacher (Course schema uses 'assignedTeacher', not 'teacherId')
 if (
  !courseExists.assignedTeacher ||
  !courseExists.assignedTeacher.userId
) {
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
    createErrorResponse(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Course teacher information is incomplete'
    )
  );
}

if (
  courseExists.assignedTeacher.userId.toString() !== req.user._id.toString() &&
  req.user.role !== ROLES.ADMIN
) {
  return res.status(HTTP_STATUS.FORBIDDEN).json(
    createErrorResponse(
      HTTP_STATUS.FORBIDDEN,
      'You do not have permission to create announcements for this course'
    )
  );
}


    const announcement = new Announcement({
      courseId,
      title,
      content,
      priority: priority || 'medium',
      attachments: attachments || [],
      isPinned: isPinned || false,
      publishDate: publishDate || new Date(),
      expiryDate,
      targetAudience: targetAudience || 'all',
      targetRecipients: targetRecipients || [],
      createdBy: req.user._id,
    });

    await announcement.save();

    return res.status(HTTP_STATUS.CREATED).json(
      createSuccessResponse(HTTP_STATUS.CREATED, 'Announcement created successfully', announcement)
    );
  } catch (error) {
    console.error('Error creating announcement:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get all announcements for a course
// @route   GET /api/announcements/course/:courseId
// @access  Public
exports.getAnnouncementsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Course not found')
      );
    }

    const announcements = await Announcement.find({ courseId })
      .sort({ isPinned: -1, publishDate: -1 })
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcements retrieved successfully', announcements)
    );
  } catch (error) {
    console.error('Error retrieving announcements:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get announcement by ID
// @route   GET /api/announcements/:announcementId
// @access  Public
exports.getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId)
      .populate('courseId', 'courseName courseCode')
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .populate('readBy.userId', 'firstName lastName email');

    if (!announcement) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Announcement not found')
      );
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcement retrieved successfully', announcement)
    );
  } catch (error) {
    console.error('Error retrieving announcement:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:announcementId
// @access  Private (Teacher/Admin)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { title, content, priority, attachments, isPinned, expiryDate, targetAudience, targetRecipients } = req.body;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Announcement not found')
      );
    }

    // Check if user is the announcement creator or admin
    if (announcement.createdBy.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to update this announcement')
      );
    }

    // Update fields
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (attachments) announcement.attachments = attachments;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (expiryDate) announcement.expiryDate = expiryDate;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (targetRecipients) announcement.targetRecipients = targetRecipients;
    announcement.lastModifiedBy = req.user._id;

    await announcement.save();

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcement updated successfully', announcement)
    );
  } catch (error) {
    console.error('Error updating announcement:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:announcementId
// @access  Private (Teacher/Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Announcement not found')
      );
    }

    // Check if user is the announcement creator or admin
    if (announcement.createdBy.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to delete this announcement')
      );
    }

    await Announcement.findByIdAndDelete(announcementId);

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcement deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Mark announcement as read
// @route   PUT /api/announcements/:announcementId/read
// @access  Private (Student/Teacher/Admin)
exports.markAsRead = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { userId } = req.body;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Announcement not found')
      );
    }

    // Check if already read
    const alreadyRead = announcement.readBy.find((read) => read.userId.toString() === userId);

    if (!alreadyRead) {
      announcement.readBy.push({
        userId,
        readAt: new Date(),
      });
      await announcement.save();
    }

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Announcement marked as read')
    );
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};

// @desc    Get announcement read statistics
// @route   GET /api/announcements/:announcementId/read-stats
// @access  Private (Teacher/Admin)
exports.getReadStats = async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId)
      .populate('readBy.userId', 'firstName lastName email');

    if (!announcement) {
      return res.status(HTTP_STATUS.NOT_FOUND).json(
        createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Announcement not found')
      );
    }

    // Check if user is the announcement creator or admin
    if (announcement.createdBy.toString() !== req.user._id && req.user.role !== ROLES.ADMIN) {
      return res.status(HTTP_STATUS.FORBIDDEN).json(
        createErrorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to view read statistics')
      );
    }

    const readStats = {
      totalReads: announcement.readBy.length,
      readBy: announcement.readBy.map((read) => ({
        userId: read.userId._id,
        userName: `${read.userId.firstName} ${read.userId.lastName}`,
        readAt: read.readAt,
      })),
    };

    return res.status(HTTP_STATUS.OK).json(
      createSuccessResponse(HTTP_STATUS.OK, 'Read statistics retrieved successfully', readStats)
    );
  } catch (error) {
    console.error('Error retrieving read statistics:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
      createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message)
    );
  }
};
