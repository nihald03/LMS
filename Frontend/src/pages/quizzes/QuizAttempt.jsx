import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizById, submitQuiz } from '../../api/quizzes';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Send,
    AlertCircle,
    CheckCircle2,
    XCircle,
    HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuizAttempt = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null); // in seconds
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const response = await getQuizById(quizId);
            const quizData = response.data.data;
            setQuiz(quizData);
            setTimeLeft(quizData.duration * 60);
        } catch (error) {
            console.error('Error fetching quiz:', error);
            toast.error('Failed to load quiz');
            navigate('/quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, selectedOptions]) => ({
                questionId,
                selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions]
            }));

            const response = await submitQuiz(quizId, {
                studentId: user.id || user._id,
                answers: formattedAnswers
            });

            toast.success('Quiz submitted successfully!');
            navigate(`/quizzes/result/${quizId}`, { state: { result: response.data.data } });
        } catch (error) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setIsSubmitting(false);
        }
    }, [quizId, user, answers, isSubmitting, navigate]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) {
            if (timeLeft === 0) handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, handleSubmit]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionSelect = (questionId, optionId, type) => {
        setAnswers(prev => {
            if (type === 'multiple_select') {
                const current = prev[questionId] || [];
                if (current.includes(optionId)) {
                    return { ...prev, [questionId]: current.filter(id => id !== optionId) };
                } else {
                    return { ...prev, [questionId]: [...current, optionId] };
                }
            } else {
                return { ...prev, [questionId]: [optionId] };
            }
        });
    };

    if (loading || !quiz) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Initializing Secure Session...</p>
        </div>
    );

    const questions = quiz.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
            {/* Header / Stats Overlay */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 -mx-4 md:-mx-8 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest bg-white">
                        <Clock className={`w-4 h-4 mr-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                        {formatTime(timeLeft)}
                    </Badge>
                    <div className="hidden md:block">
                        <h2 className="text-sm font-black text-slate-900 truncate max-w-[200px]">{quiz.title}</h2>
                        <Progress value={progress} className="h-1.5 mt-1 w-32 bg-slate-100 [&>div]:bg-primary" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Question</span>
                    <Badge className="bg-slate-900 text-white border-none font-black text-xs rounded-lg px-2">
                        {currentQuestionIndex + 1} / {questions.length}
                    </Badge>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl font-black text-[10px] uppercase tracking-widest ml-4 shadow-lg shadow-red-500/20"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) navigate('/quizzes');
                        }}
                    >
                        Exit
                    </Button>
                </div>
            </div>

            {/* Question Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 pb-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black px-3 py-1">
                            {currentQuestion?.questionType?.replace('_', ' ')}
                        </Badge>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">+{currentQuestion?.points || 1} Points</span>
                    </div>
                    <CardTitle className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                        {currentQuestion?.questionText}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-10 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {(currentQuestion?.options || []).map((option) => {
                            const isSelected = (answers[currentQuestion._id] || []).includes(option.optionId);
                            return (
                                <button
                                    key={option._id}
                                    onClick={() => handleOptionSelect(currentQuestion._id, option.optionId, currentQuestion.questionType)}
                                    className={`flex items-center gap-6 p-6 rounded-3xl border-2 text-left transition-all duration-300 group ${isSelected
                                            ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/5'
                                            : 'border-slate-50 bg-white hover:border-slate-200 hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${isSelected
                                            ? 'bg-primary text-white scale-110'
                                            : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-primary'
                                        }`}>
                                        {option.optionId.toUpperCase()}
                                    </div>
                                    <span className={`text-lg font-bold flex-1 transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                                        }`}>
                                        {option.optionText}
                                    </span>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Bottom Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl px-4 z-40">
                <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center justify-between">
                    <Button
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        variant="ghost"
                        className="rounded-2xl h-14 px-8 text-white hover:bg-white/10 font-bold"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                    </Button>

                    <div className="flex items-center gap-2">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentQuestionIndex
                                        ? 'bg-primary w-8'
                                        : answers[questions[idx]._id]
                                            ? 'bg-primary/40'
                                            : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>

                    {isLastQuestion ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="rounded-2xl h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/40"
                        >
                            {isSubmitting ? 'Submitting...' : 'Finish Quiz'} <Send className="w-5 h-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="rounded-2xl h-14 px-10 bg-white text-slate-900 hover:bg-slate-100 font-black shadow-xl shadow-white/10"
                        >
                            Next Question <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizAttempt;
