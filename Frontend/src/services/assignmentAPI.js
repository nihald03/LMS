/**
 * Assignment API Service - Frontend
 * Handles all API calls related to assignments
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

export const assignmentAPI = {
  /**
   * Get all assignments for a course
   */
  getAssignmentsByCourse: async (courseId, page = 1, limit = 10, status = null) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);

      const response = await axios.get(
        `${API_BASE_URL}/assignments/course/${courseId}?${params}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get single assignment by ID
   */
  getAssignmentById: async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Create new assignment
   */
  createAssignment: async (assignmentData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignments`,
        assignmentData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update assignment
   */
  updateAssignment: async (assignmentId, updateData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        updateData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Delete assignment
   */
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/assignments/${assignmentId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Publish assignment
   */
  publishAssignment: async (assignmentId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/publish`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Close assignment
   */
  closeAssignment: async (assignmentId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/close`,
        {},
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Submit assignment
   */
  submitAssignment: async (assignmentId, courseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get student's submission
   */
  getMySubmission: async (assignmentId, courseId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/${assignmentId}/my-submission?courseId=${courseId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Resubmit assignment
   */
  resubmitAssignment: async (assignmentId, courseId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', courseId);

      const response = await axios.post(
        `${API_BASE_URL}/assignments/${assignmentId}/resubmit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all submissions for assignment (teacher)
   */
  getAssignmentSubmissions: async (assignmentId, page = 1, limit = 10, status = null) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);

      const response = await axios.get(
        `${API_BASE_URL}/assignments/${assignmentId}/submissions?${params}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Grade submission
   */
  gradeSubmission: async (submissionId, marks, feedback) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/submissions/${submissionId}/grade`,
        { marks, feedback },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Add comment to submission
   */
  addComment: async (submissionId, comment) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/submissions/${submissionId}/comment`,
        { comment },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get assignment analytics
   */
  getAssignmentAnalytics: async (assignmentId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/assignments/${assignmentId}/analytics`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get class analytics
   */
  getClassAnalytics: async (courseId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/courses/${courseId}/assignments/analytics`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default assignmentAPI;
