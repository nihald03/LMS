import api from './api';

export const login = (email, password) => {
    return api.post('/auth/login', { email, password });
};

export const register = (userData) => {
    return api.post('/auth/register', userData);
};

export const forgotPassword = (email) => {
    return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, newPassword) => {
    return api.post('/auth/reset-password', { token, newPassword });
};

export const verifyEmail = (verificationCode) => {
    return api.post('/auth/verify-email', { verificationCode });
};
