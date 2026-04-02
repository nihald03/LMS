import api from './api';

export const getQuizzesByCourse = (courseId) => {
    return api.get(`/quizzes/course/${courseId}`);
};

export const getQuizById = (quizId) => {
    return api.get(`/quizzes/${quizId}`);
};

export const createQuiz = (data) => {
    return api.post('/quizzes', data);
};

export const updateQuiz = (quizId, data) => {
    return api.put(`/quizzes/${quizId}`, data);
};

export const deleteQuiz = (quizId) => {
    return api.delete(`/quizzes/${quizId}`);
};

export const submitQuiz = (quizId, data) => {
    return api.post(`/quizzes/${quizId}/submit`, data);
};

export const getQuizResults = (quizId, studentId) => {
    return api.get(`/quizzes/${quizId}/results/${studentId}`);
};

export const addQuestionToQuiz = (quizId, questionData) => {
    return api.post(`/quizzes/${quizId}/questions`, questionData);
};

