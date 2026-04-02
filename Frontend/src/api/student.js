import api from './api';

export const getEnrolledCourses = () => {
    return api.get('/students/courses');
};

export const getCourseDetails = (courseId) => {
    return api.get(`/students/courses/${courseId}`);
};

export const getCourseLectures = (courseId, params) => {
    return api.get(`/students/courses/${courseId}/lectures`, { params });
};

export const getLectureDetails = (lectureId) => {
    return api.get(`/students/lectures/${lectureId}`);
};

export const trackLectureView = (lectureId) => {
    return api.post(`/students/lectures/${lectureId}/track-view`);
};

export const getActivityLog = (params) => {
    return api.get('/students/activity-log', { params });
};

export const updateProfile = (data) => {
    return api.put('/auth/profile', data);
};

export const getStudentDashboard = (studentId) => {
    return api.get(`/progress/students/${studentId}/dashboard`);
};

export const getStudentGrades = (studentId) => {
    return api.get(`/progress/students/${studentId}/grades`);
};
