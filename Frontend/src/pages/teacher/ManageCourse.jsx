import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getCourseDetails } from '../../api/management';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    BookOpen,
    FileText,
    ClipboardList,
    Users,
    ArrowLeft,
    TrendingUp,
    Settings,
    MoreVertical
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import LectureManager from '../../components/teacher/LectureManager';
import QuizManager from '../../components/teacher/QuizManager';
import AssignmentList from '../../components/Assignments/AssignmentList';

const ManageCourse = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'lectures');

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        // Update active tab if tab parameter changes
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams]);

    const fetchCourse = async () => {
        try {
            const response = await getCourseDetails(courseId);
            setCourse(response.data.data);
        } catch (error) {
            console.error('Error fetching course details:', error);
            toast.error('Failed to load course details');
            navigate('/teacher/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Accessing Management Console...</p>
        </div>
    );

    if (!course) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Header */}
            <div className="relative bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 p-12 md:p-16 text-white overflow-hidden rounded-b-[4rem] shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="relative z-10 space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/teacher/dashboard')}
                        className="text-slate-400 hover:text-white px-0 font-bold flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4">
                            <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                                Course Management
                            </Badge>
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-tight italic">
                                {course.courseName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-sm uppercase tracking-widest">
                                <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {course.courseCode}</span>
                                <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Semester {course.semester}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" className="rounded-2xl border-slate-700 bg-slate-800/50 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all h-14 px-8">
                                <Settings className="w-4 h-4 mr-2" /> Settings
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-4">
                <TabsList className="bg-slate-100/50 p-1 rounded-3xl h-20 mb-8 border border-slate-200">
                    <TabsTrigger value="lectures" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg h-full">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4" /> Lectures
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg h-full">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="w-4 h-4" /> Quizzes
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg h-full">
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4" /> Assignments
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="students" className="rounded-2xl px-10 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg h-full">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4" /> Students
                        </div>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="lectures">
                    <LectureManager courseId={courseId} />
                </TabsContent>
                <TabsContent value="quizzes">
                    <QuizManager courseId={courseId} />
                </TabsContent>
                <TabsContent value="assignments">
                    <AssignmentList />
                </TabsContent>
                <TabsContent value="students">
                    <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Student Roster is managed in the Students Tab</div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManageCourse;
