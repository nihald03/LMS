// Helper function to check if a user has permission to manage a course
const { ROLES } = require('../utils/constants');

/**
 * Verify that the current user is the teacher assigned to the course
 * @param {ObjectId} courseTeacherId - The User ID assigned to the course (NOT Teacher ID)
 * @param {ObjectId} userId - The current user's ID
 * @param {String} userRole - The current user's role
 * @returns {Boolean} - True if user has permission, false otherwise
 */
const verifyTeacherPermission = (courseTeacherId, userId, userRole) => {
  // Allow admins
  if (userRole === ROLES.ADMIN) {
    return true;
  }

  // If not admin, must be a user ID matching the course's assigned teacher
  // Both courseTeacherId and userId are User._id values
  const matches = courseTeacherId.toString() === userId.toString();
  console.log(`DEBUG: Teacher permission check - Course ${courseTeacherId} vs User ${userId} - ${matches ? 'MATCH' : 'NO MATCH'}`);
  
  return matches;
};

module.exports = { verifyTeacherPermission };
