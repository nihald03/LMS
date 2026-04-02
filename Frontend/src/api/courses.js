import api from './api';

export const getAllCourses = (params) => {
    return api.get('/courses', { params });
};

export const getCourseById = (courseId) => {
    return api.get(`/courses/${courseId}`);
};

export const createCourse = (data) => {
    return api.post('/courses', data);
};

export const enrollInCourse = (courseId) => {
    return api.post('/courses/enroll/student', { courseId });
};
