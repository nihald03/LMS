import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnrolledCourses } from '../../api/student';
import { getQuizzesByCourse } from '../../api/quizzes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    FileText,
    Clock,
    ChevronRight,
    BookOpen,
    Trophy,
    AlertCircle,
    CheckCircle2,
    PlayCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllQuizzes();
    }, []);

    const fetchAllQuizzes = async () => {
    setLoading(true);

    try {
        const res = await getEnrolledCourses();

        console.log("ENROLLMENTS:", res.data.data);

        const enrolledCourses = Array.isArray(res.data.data?.enrollments)
            ? res.data.data.enrollments
            : [];

        console.log("FINAL ENROLLMENTS:", enrolledCourses);

        if (!enrolledCourses.length) {
            console.warn("No enrolled courses found");
            setQuizzes([]);
            return;
        }

        const quizPromises = enrolledCourses.map((enrollment) => {
            const courseId =
                enrollment.courseId?._id || enrollment.courseId;

            if (!courseId) {
                console.warn("Invalid enrollment:", enrollment);
                return Promise.resolve({ data: { data: [] } });
            }

            return getQuizzesByCourse(courseId).catch((err) => {
                console.error("Quiz fetch error:", err);
                return { data: { data: [] } };
            });
        });

        const quizResponses = await Promise.all(quizPromises);

        const allQuizzes = quizResponses.flatMap((response, index) => {
            const courseQuizzes = response.data?.data || [];
            const courseInfo = enrolledCourses[index]?.courseId;

            if (!courseInfo) return [];

            return courseQuizzes.map((quiz) => ({
                ...quiz,
                courseName:
                    courseInfo.courseName || courseInfo.title,
                courseCode: courseInfo.courseCode || "",
            }));
        });

        console.log("FINAL QUIZZES:", allQuizzes);

        setQuizzes(allQuizzes);

    } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes");
        setQuizzes([]);
    } finally {
        setLoading(false);
    }
};

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning Assessment Portal...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 p-12 md:p-16 text-white overflow-hidden rounded-b-[4rem] shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="relative z-10 max-w-4xl space-y-6">
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-2">
                        Assessments
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-tight">
                        Validate Your <span className="text-primary italic">Expertise.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                        Test your knowledge, identify gaps in your learning, and earn marks towards your final grade.
                    </p>
                </div>
            </div>

            <div className="px-4 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" /> Available Quizzes
                    </h2>
                    <Badge variant="secondary" className="h-10 px-6 rounded-full bg-slate-100 text-slate-600 border-none font-black text-xs uppercase tracking-widest">
                        {quizzes.length} Total
                    </Badge>
                </div>

                {quizzes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {quizzes.map((quiz) => (
                            <Card key={quiz._id} className="group border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 flex flex-col">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-primary/10 rounded-2xl">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 py-1 px-3">
                                            Quiz #{quiz.quizNumber}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">
                                        {quiz.title}
                                    </CardTitle>
                                    <CardDescription className="font-bold text-xs uppercase tracking-widest text-primary/60 mt-2">
                                        {quiz.courseName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-4 flex-1 flex flex-col space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                            <Clock className="w-4 h-4 text-primary" /> {quiz.duration} Mins
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                            <BookOpen className="w-4 h-4 text-primary" /> {quiz.totalQuestions} Questions
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                            <Trophy className="w-4 h-4 text-primary" /> {quiz.totalPoints} Points
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                            <AlertCircle className="w-4 h-4 text-primary" /> {quiz.passingScore}% Pass
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 mt-auto">
                                        <Button
                                            onClick={() => navigate(`/quizzes/attempt/${quiz._id}`)}
                                            className="w-full rounded-2xl h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-[0.98] transition-all group"
                                        >
                                            <PlayCircle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                                            Start Attempt
                                            <ChevronRight className="w-5 h-5 ml-auto opacity-50 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center space-y-6 animate-in fade-in duration-700">
                        <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <FileText className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">No quizzes available.</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">Either you are not enrolled in any courses with quizzes, or they haven't been published yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizList;
