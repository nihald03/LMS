import api from './api';

/**
 * Get all assignment submissions for a course (pending grading)
 * @param {string} courseId 
 */
export const getSubmissionsByStatus = (courseId, status = 'submitted') => {
    return api.get(`/assignments/${courseId}/submissions?status=${status}`);
};

/**
 * Get single assignment submission details
 * @param {string} submissionId 
 */
export const getSubmissionDetails = (submissionId) => {
    return api.get(`/submissions/${submissionId}`);
};

/**
 * Get all submissions for an assignment
 * @param {string} assignmentId 
 */
export const getAssignmentSubmissions = (assignmentId) => {
    return api.get(`/assignments/${assignmentId}/submissions`);
};

/**
 * Grade an assignment submission (Teacher action)
 * @param {string} submissionId 
 * @param {Object} gradeData - { score, feedback, maxPoints }
 */
export const gradeSubmission = (submissionId, gradeData) => {
    return api.post(`/assignments/submissions/${submissionId}/grade`, gradeData);
};

/**
 * Get pending grading count for teacher
 * @param {string} courseId 
 */
export const getPendingGradingCount = (courseId) => {
    return api.get(`/assignments/teacher/pending`);
};

/**
 * Get student's grade record
 * @param {string} studentId 
 * @param {string} courseId 
 */
export const getStudentGrade = (studentId, courseId) => {
    return api.get(`/grades/${studentId}/${courseId}`);
};

/**
 * Get all grades for a course
 * @param {string} courseId 
 */
export const getCourseGrades = (courseId) => {
    return api.get(`/grades/course/${courseId}`);
};

/**
 * Export grades to CSV
 * @param {string} courseId 
 */
export const exportGradesToCSV = (courseId) => {
    return api.get(`/grades/course/${courseId}/export`, { responseType: 'blob' });
};

/**
 * Get rubric for assignment
 * @param {string} assignmentId 
 */
export const getAssignmentRubric = (assignmentId) => {
    return api.get(`/assignments/${assignmentId}/rubric`);
};

/**
 * Save rubric for assignment
 * @param {string} assignmentId 
 * @param {Object} rubricData 
 */
export const saveAssignmentRubric = (assignmentId, rubricData) => {
    return api.post(`/assignments/${assignmentId}/rubric`, rubricData);
};
