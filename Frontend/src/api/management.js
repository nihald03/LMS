import api from './api';

// Lectures Management
export const getLecturesByCourse = (courseId) => api.get(`/lectures/course/${courseId}`);
export const createLecture = (data) => api.post('/lectures', data);
export const updateLecture = (id, data) => api.put(`/lectures/${id}`, data);
export const deleteLecture = (id) => api.delete(`/lectures/${id}`);
export const publishLecture = (id) => api.post(`/lectures/${id}/publish`);

// Quizzes Management
export const getQuizzesByCourse = (courseId) => api.get(`/quizzes/course/${courseId}`);
export const createQuiz = (data) => api.post('/quizzes', data);
export const updateQuiz = (id, data) => api.put(`/quizzes/${id}`, data);
export const deleteQuiz = (id) => api.delete(`/quizzes/${id}`);
export const addQuestionToQuiz = (quizId, data) => api.post(`/quizzes/${quizId}/questions`, data);

// Assignments Management
export const getAssignmentsByCourse = (courseId) =>
  api.get(`/assignments/course/${courseId?._id || courseId}`);

export const getAssignmentById = (assignmentId) => api.get(`/assignments/${assignmentId}`);
export const createAssignment = (data) => api.post('/assignments', data);
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data);
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`);
export const submitAssignment = (assignmentId, data, courseId) => {
  if (data instanceof FormData) {
    const finalCourseId = courseId?._id || courseId;

    if (!finalCourseId) {
      console.error("❌ courseId missing:", courseId);
    }

    // 🔥 FIX: Prevent duplicate courseId
    if (data.has('courseId')) {
      data.delete('courseId');
    }

    data.append('courseId', finalCourseId);

    return api.post(`/assignments/${assignmentId}/submit`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  const payload = {
    ...data,
    courseId: courseId?._id || courseId
  };

  return api.post(`/assignments/${assignmentId}/submit`, payload);
};

// Get pending submissions for teacher - Get all pending submissions across teacher's courses
export const getPendingSubmissions = () => {
  // This endpoint gets pending submissions for the authenticated teacher
  return api.get(`/assignments/teacher/pending`);
};

// Get assignment submissions for grading
export const getAssignmentSubmissions = (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`);

// Get assignment analytics
export const getAssignmentAnalytics = (assignmentId) => api.get(`/assignments/${assignmentId}/analytics`);

// Grade submission
export const gradeSubmission = (submissionId, data) => api.post(`/assignments/submissions/${submissionId}/grade`, data);

// Add comment to submission
export const addCommentToSubmission = (submissionId, data) => api.post(`/assignments/submissions/${submissionId}/comment`, data);

// Publish assignment
export const publishAssignment = (assignmentId) => api.post(`/assignments/${assignmentId}/publish`);

// Close assignment
export const closeAssignment = (assignmentId) => api.post(`/assignments/${assignmentId}/close`);

// Resubmit assignment
export const resubmitAssignment = (assignmentId, data, courseId) => {
  if (data instanceof FormData) {
    data.append('courseId', courseId);
    return api.post(`/assignments/${assignmentId}/resubmit`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  const payload = {
    ...data,
    courseId: courseId
  };
  return api.post(`/assignments/${assignmentId}/resubmit`, payload);
};

// Get my submission for assignment
export const getMySubmission = (assignmentId) => api.get(`/assignments/${assignmentId}/my-submission`);

// Course Details for Teacher
export const getCourseDetails = (courseId) => api.get(`/courses/${courseId}`);
