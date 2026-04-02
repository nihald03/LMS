import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    getClassProgressSummary,
    getCourseAnalytics,
    getEngagementMetrics
} from '../../api/teacher';
import {
    BarChart,
    Users,
    Activity,
    TrendingUp,
    Download,
    Filter,
    ArrowLeft,
    Loader2,
    PieChart,
    Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StudentPerformance = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('course');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [classSummary, setClassSummary] = useState(null);
    const [engagement, setEngagement] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!courseId) {
                setLoading(false);
                return;
            }

            try {
                const [analyticsRes, summaryRes, engagementRes] = await Promise.all([
                    getCourseAnalytics(courseId),
                    getClassProgressSummary(courseId),
                    getEngagementMetrics(courseId)
                ]);

                setAnalytics(analyticsRes.data.data);
                setClassSummary(summaryRes.data.data);
                setEngagement(engagementRes.data.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                toast.error('Failed to load performance data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [courseId]);

    if (!courseId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center space-y-6 animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center">
                    <BarChart className="w-10 h-10 text-primary" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Select a Course</h2>
                    <p className="text-slate-500 font-medium font-serif italic mb-8">
                        Choose a course from your management panel to view detailed performance metrics
                    </p>
                    <Button
                        onClick={() => navigate('/teacher/courses')}
                        className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-6 rounded-2xl shadow-xl shadow-primary/20"
                    >
                        Go to Courses
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-slate-500 font-medium">Analyzing student performance data...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/teacher/courses')}
                        className="p-0 h-auto hover:bg-transparent text-slate-400 hover:text-primary transition-colors font-bold flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Courses
                    </Button>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                        {analytics?.courseName || 'Course'} <span className="text-primary">Analytics</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black rounded-full px-4">Semester 2</Badge>
                        <span className="text-slate-400 font-medium">•</span>
                        <span className="text-slate-400 font-medium">Academic Year 2024-25</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl font-black py-6 border-slate-200 shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export Report
                    </Button>
                    <Button className="bg-slate-900 text-white rounded-2xl font-black py-6 shadow-xl shadow-slate-900/10">
                        <Filter className="w-4 h-4 mr-2" /> Filter Data
                    </Button>
                </div>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Enrolled', value: classSummary?.totalStudents || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { title: 'Average Grade', value: `${analytics?.overallAverage || 0}%`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { title: 'Pass Rate', value: `${analytics?.passingRate || 0}%`, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
                    { title: 'Average Progress', value: `${classSummary?.averageProgress || 0}%`, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full ${stat.bg} group-hover:scale-110 transition-transform duration-500`}></div>
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.title}</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-black tracking-tight">{stat.value}</span>
                                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Performance Charts & Roster Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Metrics */}
                <Card className="border-none shadow-xl shadow-slate-200/40 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-primary" /> Engagement
                        </CardTitle>
                        <CardDescription>Activity rates for different modules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {[
                            { label: 'Lecture Completion', value: `${engagement?.lectureEngagement?.completionRate || 0}%`, color: 'bg-blue-500' },
                            { label: 'Quiz Participation', value: `${engagement?.quizEngagement?.completionRate || 0}%`, color: 'bg-emerald-500' },
                            { label: 'Assignment Submission', value: `${engagement?.assignmentEngagement?.submissionRate || 0}%`, color: 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                                    <p className="text-lg font-black">{item.value}</p>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        style={{ width: item.value }}
                                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Grade Distribution */}
                <Card className="border-none shadow-xl shadow-slate-200/40 lg:col-span-2 bg-slate-900 text-white rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-white">Grade Distribution</CardTitle>
                        <CardDescription className="text-slate-400 font-serif">Comprehensive breakdown of class results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-56 gap-4 py-4">
                            {Object.entries(analytics?.gradeDistribution || {}).map(([grade, count]) => {
                                const height = count > 0 ? `${(count / (classSummary?.totalStudents || 1)) * 100}%` : '8%';
                                const colors = {
                                    A: 'bg-primary',
                                    B: 'bg-blue-400',
                                    C: 'bg-slate-400',
                                    D: 'bg-amber-400',
                                    F: 'bg-red-500'
                                };
                                return (
                                    <div key={grade} className="flex-1 flex flex-col items-center justify-end gap-3 group">
                                        <div
                                            style={{ height }}
                                            className={`w-full max-w-[24px] md:max-w-[40px] rounded-t-2xl ${colors[grade]} transition-all duration-500 group-hover:opacity-80 relative`}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg">
                                                {count} Students
                                            </div>
                                        </div>
                                        <span className="text-sm font-black text-slate-500 group-hover:text-white">{grade}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Student Progress Roster */}
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
                    <div>
                        <CardTitle className="text-2xl font-black">Student Performance Roster</CardTitle>
                        <CardDescription>Individual tracking and performance metrics</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" className="rounded-xl font-bold">Passing</Button>
                        <Button variant="ghost" className="rounded-xl font-bold text-slate-400">At Risk</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                                    <th className="text-center py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="text-center py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance</th>
                                    <th className="text-center py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                    <th className="text-right py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Final Grade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(classSummary?.studentsSummary || []).map((student, i) => (
                                    <tr key={student.studentId} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-700">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{student.name}</p>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-center">
                                            <Badge className={`rounded-full font-black uppercase text-[10px] px-3 py-1 ${student.status === 'active' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                                {student.status}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-8 text-center">
                                            <p className="font-bold text-slate-700">{student.progress}%</p>
                                        </td>
                                        <td className="py-6 px-8 min-w-[200px]">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${student.progress}%` }}
                                                        className="h-full bg-primary rounded-full"
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-black text-slate-500">
                                                    {student.progress}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <p className="font-black text-lg text-slate-900">
                                                {student.currentGrade}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentPerformance;
