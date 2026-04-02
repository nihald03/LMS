import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherDashboard } from '../../api/teacher';
import {
    BookOpen,
    Users,
    BarChart2,
    Plus,
    Search,
    MoreVertical,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const CourseManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            const teacherId = user?.id || user?._id;
            if (!teacherId) return;

            try {
                const response = await getTeacherDashboard(teacherId);
                setCourses(response.data.data.coursesList || []);
            } catch (error) {
                console.error('Error fetching courses:', error);
                toast.error('Failed to load courses');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchCourses();
        }
    }, [user]);

    const filteredCourses = courses.filter(course =>
        course.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Loading your courses...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
                        Manage <span className="text-primary">Courses</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-serif italic">
                        Organize content and monitor student enrollment
                    </p>
                </div>
                <Button 
                    onClick={() => navigate('/teacher/courses/create')}
                    className="bg-primary hover:bg-primary/90 text-white font-black px-6 py-6 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add New Course
                </Button>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search your courses..."
                        className="pl-12 bg-transparent border-none focus-visible:ring-0 text-lg font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 pr-2">
                    <Button variant="ghost" className="rounded-2xl font-bold">Latest</Button>
                    <Button variant="ghost" className="rounded-2xl font-bold text-slate-400">Archived</Button>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                    <Card key={course.courseId} className="group border-none shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white">
                        <CardContent className="p-8 space-y-6">
                            {/* Course Header */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-slate-200 text-slate-500 px-4 py-1.5 rounded-full">
                                        {course.isActive ? 'Active' : 'Archived'}
                                    </Badge>
                                    <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">
                                        {course.courseName}
                                    </h3>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                                    <MoreVertical className="w-5 h-5 text-slate-400" />
                                </Button>
                            </div>

                            {/* Stats Chips */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-bold text-slate-700">{course.studentCount} Students</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <BarChart2 className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-bold text-slate-700">{course.averageScore}% Avg</span>
                                </div>
                            </div>

                            {/* Content Preview */}
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black">
                                            {String.fromCharCode(64 + i)}
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-4 border-white bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                        +{course.studentCount > 3 ? course.studentCount - 3 : 0}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completion: {course.completionRate}%</p>
                            </div>

                            {/* Actions Column */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <Button
                                    onClick={() => navigate(`/teacher/students?course=${course.courseId}`)}
                                    variant="outline"
                                    className="border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 rounded-[1.5rem] py-6 font-black text-slate-700 active:scale-95 transition-all"
                                >
                                    Roster
                                </Button>
                                <Button
                                    onClick={() => navigate(`/teacher/analytics?course=${course.courseId}`)}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] py-6 font-black shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                                >
                                    Analytics <ExternalLink className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">No courses found</h3>
                    <p className="text-slate-400">Try adjusting your search or add a new course.</p>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;
