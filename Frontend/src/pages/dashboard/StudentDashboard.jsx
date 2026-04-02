import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEnrolledCourses, getActivityLog } from '../../api/student';
import { getStudentDashboard } from '../../api/student';
import { getAssignmentsByCourse } from '../../api/management';
import WelcomeSection from '../../components/dashboard/WelcomeSection';
import QuickStats from '../../components/dashboard/QuickStats';
import RecentCourses from '../../components/dashboard/RecentCourses';
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines';
import UpcomingAssignments from '../../components/dashboard/UpcomingAssignments';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { toast } from 'react-hot-toast';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [activities, setActivities] = useState([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all necessary data
            const [coursesRes, activitiesRes] = await Promise.all([
                getEnrolledCourses(),
                getActivityLog({ limit: 10 }).catch(() => ({ data: { data: { activities: [] } } }))
            ]);

            // Process enrolled courses
            const enrollmentData = Array.isArray(coursesRes.data.data?.enrollments)
                ? coursesRes.data.data.enrollments
                : [];
            console.log("ENROLLMENTS:", coursesRes.data);
            const mappedCourses = enrollmentData.map(enrollment => ({
                ...enrollment.courseId,
                enrollmentId: enrollment._id,
                progress: enrollment.attendancePercentage || 0,
                enrollmentStatus: enrollment.status,
                grade: enrollment.grade
            }));

            setEnrolledCourses(mappedCourses);

            // Fetch assignments from all courses
            const assignmentsPromises = mappedCourses.map(course =>
                getAssignmentsByCourse(course._id)
                    .then(res => {
                        const assignments = Array.isArray(res.data) ? res.data : res.data.data || [];
                       return assignments.map(a => ({ 
                        ...a, 
                        courseId: course._id,   // ✅ Fixed: Use course ID string
                        courseName: course.courseName
                        }));
                    })
                    .catch(() => [])
            );

            const allAssignments = await Promise.all(assignmentsPromises);
            const flatAssignments = allAssignments.flat();
            
            // Filter only published assignments
            const publishedAssignments = flatAssignments.filter(a => a.isPublished !== false);
            setUpcomingAssignments(publishedAssignments);

            // Process activities
            const activitiesData = activitiesRes.data.data?.activities || [];
            setActivities(activitiesData);

            // Calculate dashboard summary
            const completed = mappedCourses.filter(c => c.enrollmentStatus === 'completed').length;
            const inProgress = mappedCourses.filter(c => c.enrollmentStatus === 'active').length;
            
            // Calculate average GPA (from grades if available)
            const gpa = mappedCourses.length > 0
                ? (mappedCourses.reduce((sum, c) => sum + (c.grade || 3.0), 0) / mappedCourses.length).toFixed(2)
                : 0;

            setDashboardData({
                totalCoursesEnrolled: mappedCourses.length,
                completedCourses: completed,
                inProgressCourses: inProgress,
                overallGPA: parseFloat(gpa),
                studentName: user?.name || 'Student',
                recentCourses: mappedCourses.slice(0, 4),
                upcomingDeadlines: [] // Will be populated from API if available
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full animate-pulse mx-auto"></div>
                    <p className="text-slate-400 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Section */}
                {dashboardData && (
                    <WelcomeSection 
                        studentName={dashboardData.studentName}
                        totalCourses={dashboardData.totalCoursesEnrolled}
                    />
                )}

                {/* Quick Stats */}
                {dashboardData && (
                    <QuickStats
                        totalCourses={dashboardData.totalCoursesEnrolled}
                        completedCourses={dashboardData.completedCourses}
                        inProgressCourses={dashboardData.inProgressCourses}
                        overallGPA={dashboardData.overallGPA}
                    />
                )}

                {/* Recent Courses */}
                {enrolledCourses.length > 0 && (
                    <RecentCourses
                        courses={enrolledCourses}
                        onCourseClick={(courseId) =>
                            navigate(`/courses/${courseId?._id || courseId}`)
                        }
                    />
                )}

                {/* Upcoming Assignments */}
                {upcomingAssignments.length > 0 && (
                    <UpcomingAssignments assignments={upcomingAssignments} />
                )}

                {/* Upcoming Deadlines */}
                {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 && (
                    <UpcomingDeadlines deadlines={dashboardData.upcomingDeadlines} />
                )}

                {/* Recent Activity */}
                {activities.length > 0 && (
                    <RecentActivity activities={activities} />
                )}

                {/* Empty State */}
                {enrolledCourses.length === 0 && !loading && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-200">No courses yet</h3>
                            <p className="text-slate-400 mb-6">
                                Browse available courses and start learning today!
                            </p>
                            <button
                                onClick={() => navigate('/courses')}
                                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all"
                            >
                                Browse Courses
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
