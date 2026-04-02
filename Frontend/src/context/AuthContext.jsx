import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (savedUser && token) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const loginSuccess = (userData, token, refreshToken) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
        setUser(userData);

        // Redirect based on role
        if (userData.role === 'admin') {
            navigate('/admin/dashboard');
        } else if (userData.role === 'teacher') {
            navigate('/teacher/dashboard');
        } else {
            navigate('/dashboard');
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        navigate('/login');
    };

    const value = {
        user,
        loading,
        loginSuccess,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
