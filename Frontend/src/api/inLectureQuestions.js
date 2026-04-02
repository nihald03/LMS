/**
 * In-Lecture Questions API Integration
 * Handles all API calls for in-lecture questions feature
 */

import api from './api';

/**
 * Fetch all questions for a lecture
 * @param {string} lectureId - The lecture ID
 * @returns {Promise} Questions data
 */
export const getLectureQuestions = async (lectureId) => {
    try {
        const response = await api.get(`/students/lectures/${lectureId}/questions`);
        return response.data;
    } catch (error) {
        console.error('Error fetching lecture questions:', error);
        throw error;
    }
};

/**
 * Submit answer to an in-lecture question
 * @param {string} lectureId - The lecture ID
 * @param {string} questionId - The question ID
 * @param {string} selectedOption - The selected option ID
 * @returns {Promise} Response with isCorrect and pointsAwarded
 */
export const respondToInLectureQuestion = async (lectureId, questionId, selectedOption) => {
    try {
        const response = await api.post(
            `/lectures/${lectureId}/in-lecture-questions/${questionId}/respond`,
            { selectedOption }
        );
        return response.data;
    } catch (error) {
        console.error('Error submitting answer:', error);
        throw error;
    }
};

/**
 * Create a new in-lecture question (Teacher only)
 * @param {string} lectureId - The lecture ID
 * @param {Object} questionData - Question details
 * @returns {Promise} Created question data
 */
export const createInLectureQuestion = async (lectureId, questionData) => {
    try {
        const response = await api.post(
            `/lectures/${lectureId}/in-lecture-questions`,
            questionData
        );
        return response.data;
    } catch (error) {
        console.error('Error creating question:', error);
        throw error;
    }
};

/**
 * Get analytics for all in-lecture questions of a lecture
 * @param {string} lectureId - The lecture ID
 * @returns {Promise} Analytics data with question-wise statistics
 */
export const getLectureQuestionAnalytics = async (lectureId) => {
    try {
        const response = await api.get(
            `/lectures/${lectureId}/in-lecture-questions/analytics`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
    }
};
