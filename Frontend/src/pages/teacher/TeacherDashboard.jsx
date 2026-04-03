import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTeacherDashboard } from '../../api/teacher';
import { getPendingSubmissions } from '../../api/management';
import {
    Users,
    BookOpen,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    BarChart3,
    ArrowUpRight,
    Loader2,
    Plus,
    Video,
    ClipboardList,
    FileText,
    ChevronRight,
    BarChart as BarChartIcon,
    ClipboardCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from 'react-hot-toast';
import PendingSubmissions from '../../components/dashboard/PendingSubmissions';

const TeacherDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [pendingSubmissions, setPendingSubmissions] = useState([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            const teacherId = user?.id || user?._id;
            if (!teacherId) return;

            try {
                const response = await getTeacherDashboard(teacherId);
                setDashboardData(response.data.data);

                // Fetch pending submissions
                try {
                    const submissionsResponse = await getPendingSubmissions();
                    const submissions = Array.isArray(submissionsResponse.data) 
                        ? submissionsResponse.data 
                        : submissionsResponse.data.data || [];
                    setPendingSubmissions(submissions);
                } catch (error) {
                    console.warn('Could not fetch pending submissions:', error);
                    // Don't fail if this endpoint doesn't exist yet
                }
            } catch (error) {
                console.error('Error fetching teacher dashboard:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboard();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
            </div>
        );
    }

    if (!dashboardData) return null;

    const {
        name: teacherName,
        coursesList: courses,
        statistics,
        totalAssignmentsPending,
        totalStudents,
        activeCourses,
        recentActivity
    } = dashboardData;

    const stats = [
        {
            title: 'Enrolled Students',
            value: totalStudents,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Active Courses',
            value: activeCourses,
            icon: BookOpen,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: 'Average Progress',
            value: `${statistics.averageStudentProgress}%`,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: 'Completion Rate',
            value: `${statistics.courseCompletionRate}%`,
            icon: CheckCircle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
                        Welcome back, <span className="text-primary">{teacherName}</span>
                    </h1>
                    <p className="text-slate-500 font-medium italic">
                        Explore your teaching dashboard and student metrics.
                    </p>
                </div>
                {totalAssignmentsPending > 0 && (
                    <Badge variant="destructive" className="px-4 py-2 rounded-full text-sm font-bold flex gap-2 animate-bounce">
                        <AlertCircle className="w-4 h-4" />
                        {totalAssignmentsPending} Assignments for Grading
                    </Badge>
                )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="border-none shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${stat.bg} opacity-20 group-hover:scale-110 transition-transform duration-500`}></div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">
                                {stat.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black text-slate-900 tracking-tight">
                                    {stat.value}
                                </span>
                                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Create Section */}
            {courses && courses.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Quick Create</h2>
                        <p className="text-slate-500 font-medium">Select a course to create lectures, quizzes, or assignments</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-bold text-slate-700">Select Course:</label>
                            <select 
                                value={selectedCourseId || ''} 
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            >
                                <option value="">Choose a course...</option>
                                {courses.map((course) => (
                                    <option key={course.courseId} value={course.courseId}>
                                        {course.courseName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedCourseId && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                                <Button
                                    onClick={() => navigate(`/teacher/manage/${selectedCourseId}?tab=lectures`)}
                                    className="rounded-xl font-black text-xs uppercase tracking-widest h-14 shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
                                >
                                    <Video className="w-4 h-4 mr-2" />
                                    Create Lecture
                                </Button>
                                <Button
                                    onClick={() => navigate(`/teacher/manage/${selectedCourseId}?tab=quizzes`)}
                                    className="rounded-xl font-black text-xs uppercase tracking-widest h-14 shadow-lg shadow-purple-500/20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all"
                                >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Create Quiz
                                </Button>
                                <Button
                                    onClick={() => navigate(`/teacher/manage/${selectedCourseId}?tab=assignments`)}
                                    className="rounded-xl font-black text-xs uppercase tracking-widest h-14 shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Create Assignment
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Grading Shortcuts */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Grade & Analytics</h2>
                    <p className="text-slate-600 font-medium">Manage student grades and view performance metrics</p>
                </div>

                {/* Pending Submissions Widget */}
                {pendingSubmissions.length > 0 && (
                    <PendingSubmissions submissions={pendingSubmissions} />
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card 
                        className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => navigate('/teacher/grading')}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <ClipboardCheck className="w-8 h-8 text-orange-500 group-hover:scale-110 transition-transform" />
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Grade Submissions</h3>
                            <p className="text-xs text-slate-600">Review and grade student assignments</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                            if (selectedCourseId) {
                                navigate(`/teacher/grades?course=${selectedCourseId}`);
                            } else {
                                toast.error('Please select a course first');
                            }
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <BarChartIcon className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Grade Analytics</h3>
                            <p className="text-xs text-slate-600">View grades and performance analytics</p>
                        </CardContent>
                    </Card>

                    <Card 
                        className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                            if (selectedCourseId) {
                                navigate(`/teacher/analytics?course=${selectedCourseId}`);
                            } else {
                                toast.error('Please select a course first');
                            }
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <TrendingUp className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="font-bold text-slate-900 mb-1">Student Progress</h3>
                            <p className="text-xs text-slate-600">Track student engagement and progress</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Courses Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Your Courses</h2>
                        <Button variant="ghost" className="text-primary font-bold hover:text-primary hover:bg-primary/5">
                            View All <ArrowUpRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid gap-6">
                        {courses.map((course) => (
                            <Card key={course.courseId} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3">
                                                    {course.isActive ? 'ACTIVE' : 'ARCHIVED'}
                                                </Badge>
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                <span className="text-xs font-bold text-slate-400">{course.studentCount} Students</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                {course.courseName}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Average Score</p>
                                                <p className="text-xl font-black text-slate-900">{course.averageScore}%</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Completion</p>
                                                <p className="text-xl font-black text-slate-900">{course.completionRate}%</p>
                                            </div>
                                            <Button
                                                onClick={() => navigate(`/teacher/manage/${course.courseId}`)}
                                                className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 shadow-lg shadow-primary/20"
                                            >
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Recent Activity</h2>
                    <Card className="border-none bg-white shadow-xl overflow-hidden">
                        <CardHeader className="pb-0">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                <span className="text-lg font-black tracking-tight text-slate-900">Latest Updates</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {recentActivity && recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{activity.details}</p>
                                    <p className="text-xs text-slate-400">
                                    {new Date(activity.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                                </div>
                            ))
                            ) : (
                            <p className="text-slate-400 text-sm">No recent activity</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Engagement Metric */}
                    <Card className="border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-primary/20 rounded-full blur-3xl"></div>
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Engagement Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black tracking-tighter text-white">
                                    {statistics.studentEngagementRate}%
                                </span>
                                <TrendingUp className="w-8 h-8 text-emerald-400 mb-2" />
                            </div>
                            <p className="text-slate-400 text-xs mt-4">
                                Based on current course activity
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
