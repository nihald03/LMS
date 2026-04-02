import React, { useState, useEffect } from 'react';
import { getEnrolledCourses } from '../../api/student';
import CourseProgressCard from '../../components/courses/CourseProgressCard';
import { Badge } from '../../components/ui/badge';
import { BookOpen, Search, Trophy, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        if (!loading && courses.length > 0) return; // Prevent redundant calls if data exists
        setLoading(true);
        try {
            const response = await getEnrolledCourses();
            // Backend returns { success: true, data: { enrollments: [...] } }
            const enrollmentData = Array.isArray(response.data.data?.enrollments)
                ? response.data.data.enrollments
                : [];
            console.log("ENROLLMENTS:", response.data);

            // Map enrollment data to match what CourseProgressCard expects
            const mappedCourses = enrollmentData.map(enrollment => ({
                ...enrollment.courseId, // Flatten the courseId object
                enrollmentId: enrollment._id,
                progress: enrollment.attendancePercentage || 0, // Using attendance as progress for now
                enrollmentStatus: enrollment.status,
                grade: enrollment.grade
            }));

            setCourses(mappedCourses);
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            toast.error('Failed to load your courses');
            // Mock data for demo
            setCourses([
                {
                    _id: '1',
                    courseName: 'Complete Web Development Bootcamp 2024',
                    assignedTeacher: { name: 'Dr. Angela Yu' },
                    progress: 45,
                    duration: 65,
                },
                {
                    _id: '2',
                    courseName: 'Graphic Design Masterclass',
                    assignedTeacher: { name: 'Lindsay Marsh' },
                    progress: 12,
                    duration: 28,
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full -ml-10 -mb-10"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <Badge className="bg-primary/20 text-primary border-none text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 backdrop-blur-sm">
                            Student Portal
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                            My Learning <span className="text-primary italic">Journey</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl font-medium leading-relaxed">
                            You have <span className="text-white font-bold">{courses.length}</span> active courses. Keep pushing your limits and stay consistent!
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-1">
                            <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                            <p className="text-2xl font-black tracking-tighter">{courses.filter(c => c.progress === 100).length}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Completed</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 space-y-1">
                            <Clock className="w-6 h-6 text-primary mb-2" />
                            <p className="text-2xl font-black tracking-tighter">{courses.length}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">In Progress</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary" /> Active Courses
                    </h2>
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex -space-x-3 overflow-hidden p-1">
                            {[1, 2, 3, 4].map(i => (
                                <img key={i} className="inline-block h-8 w-8 rounded-full ring-4 ring-slate-50" src={`https://i.pravatar.cc/100?u=${i}`} alt="student" />
                            ))}
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-900 ring-4 ring-slate-50 text-[10px] font-bold text-white uppercase">
                                +12k
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">Learning with others</span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 rounded-[2rem] bg-slate-100 animate-pulse border border-slate-200"></div>
                        ))}
                    </div>
                ) : courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map(course => (
                            <CourseProgressCard key={course._id || course.enrollmentId} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 text-center px-6">
                        <div className="bg-slate-50 p-8 rounded-full mb-6">
                            <Search className="w-16 h-16 text-slate-300" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">No enrolled courses yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed mb-8">
                            You haven't started any courses yet. Explore our catalog and find the perfect path for your growth.
                        </p>
                        <button
                            onClick={() => window.location.href = '/courses'}
                            className="bg-primary text-white font-black px-10 py-4 rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
                        >
                            Explore Catalog
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCourses;
