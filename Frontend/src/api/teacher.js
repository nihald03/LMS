import api from './api';

/**
 * Get courses created by current teacher
 */
export const getCoursesCreatedByTeacher = () => {
    return api.get('/teachers/my-courses');
};

/**
 * Get teacher dashboard data
 * @param {string} teacherId - The USER ID of the teacher
 */
export const getTeacherDashboard = (teacherId) => {
    return api.get(`/teachers/${teacherId}/dashboard`);
};

/**
 * Get analytics for a specific course
 * @param {string} courseId 
 */
export const getCourseAnalytics = (courseId) => {
    return api.get(`/courses/${courseId}/analytics`);
};

/**
 * Get individual student progress in a course
 * @param {string} courseId 
 * @param {string} studentId 
 */
export const getStudentProgress = (courseId, studentId) => {
    return api.get(`/courses/${courseId}/students/${studentId}/progress`);
};

/**
 * Get class progress summary for all students in a course
 * @param {string} courseId 
 * @param {number} page
 * @param {number} limit
 */
export const getClassProgressSummary = (courseId, page = 1, limit = 10) => {
    return api.get(`/courses/${courseId}/class-progress-summary?page=${page}&limit=${limit}`);
};

/**
 * Get engagement metrics for a course
 * @param {string} courseId 
 */
export const getEngagementMetrics = (courseId) => {
    return api.get(`/courses/${courseId}/engagement-metrics`);
};
