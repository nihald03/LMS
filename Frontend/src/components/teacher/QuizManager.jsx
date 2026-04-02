import React, { useState, useEffect } from 'react';
import {
    getQuizzesByCourse,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestionToQuiz
} from '../../api/management';
import { getQuizById } from '../../api/quizzes';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
    Plus,
    ClipboardList,
    Edit2,
    Trash2,
    Settings,
    Clock,
    Trophy,
    HelpCircle,
    ChevronRight,
    X,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const QuizManager = ({ courseId }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [currentQuizForQuestions, setCurrentQuizForQuestions] = useState(null);

    const [quizForm, setQuizForm] = useState({
        title: '',
        description: '',
        passingScore: 70,
        totalPoints: 100,
        duration: 30,
        totalQuestions: 0,
        quizNumber: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        isPublished: false
    });

    const [questionForm, setQuestionForm] = useState({
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 20,
        explanation: ''
    });

    useEffect(() => {
        fetchQuizzes();
    }, [courseId]);

    const fetchQuizzes = async () => {
        try {
            const response = await getQuizzesByCourse(courseId);
            setQuizzes(response.data.data);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenQuizModal = (quiz = null) => {
        if (quiz) {
            setEditingQuiz(quiz);
            setQuizForm({
                title: quiz.title,
                description: quiz.description || '',
                passingScore: quiz.passingScore || 70,
                totalPoints: quiz.totalPoints || 100,
                duration: quiz.duration || 30,
                totalQuestions: quiz.totalQuestions || 0,
                quizNumber: quiz.quizNumber || 1,
                startDate: quiz.startDate ? quiz.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                endDate: quiz.endDate ? quiz.endDate.split('T')[0] : new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                isPublished: quiz.isPublished || false
            });
        } else {
            setEditingQuiz(null);
            // Calculate next quiz number based on existing quizzes
            const nextNumber = quizzes.length > 0 
                ? Math.max(...quizzes.map(q => q.quizNumber || 0)) + 1 
                : 1;
            setQuizForm({
                title: '',
                description: '',
                passingScore: 70,
                totalPoints: 100,
                duration: 30,
                totalQuestions: 0,
                quizNumber: nextNumber,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                isPublished: false
            });
        }
        setShowQuizModal(true);
    };

    const handleQuizSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingQuiz) {
                await updateQuiz(editingQuiz._id, quizForm);
                toast.success('Quiz updated successfully');
            } else {
                await createQuiz({ ...quizForm, courseId });
                toast.success('Quiz created successfully');
            }
            setShowQuizModal(false);
            fetchQuizzes();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save quiz');
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm('Delete this quiz?')) return;
        try {
            await deleteQuiz(id);
            toast.success('Quiz deleted');
            fetchQuizzes();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleOpenQuestions = async (quiz) => {
        try {
            console.log('=== OPEN QUESTIONS START ===');
            console.log('Opening quiz ID:', quiz._id);
            const response = await getQuizById(quiz._id);
            console.log('Quiz data fetched:', response.data.data);
            setCurrentQuizForQuestions(response.data.data);
            setShowQuestionModal(true);
            console.log('Modal opened with', response.data.data.questions?.length || 0, 'questions');
            console.log('=== OPEN QUESTIONS END ===');
        } catch (error) {
            console.error('ERROR opening questions:', error);
            toast.error('Failed to load questions');
        }
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        try {
            console.log('=== ADD QUESTION START ===');
            console.log('Current quiz ID:', currentQuizForQuestions._id);
            console.log('Current questions count:', currentQuizForQuestions.questions?.length || 0);
            
            // Transform questionForm to match backend requirements
            // Convert type to backend enum: multiple_choice -> mcq
            let backendQuestionType = questionForm.type;
            if (questionForm.type === 'multiple_choice') {
                backendQuestionType = 'mcq';
            } else if (questionForm.type === 'multiple_select') {
                backendQuestionType = 'multiple_select';
            } else if (questionForm.type === 'short_answer') {
                backendQuestionType = 'short_answer';
            } else if (questionForm.type === 'essay') {
                backendQuestionType = 'essay';
            }

            // Convert options from array of strings to array of objects
            const optionsArray = questionForm.options.map((optionText, index) => ({
                optionId: `option_${index}`,
                optionText: optionText,
                isCorrect: index === questionForm.correctAnswer,
                explanation: ''
            }));

            const questionData = {
                questionNumber: (currentQuizForQuestions.questions?.length || 0) + 1,
                questionType: backendQuestionType,
                questionText: questionForm.question,
                options: optionsArray,
                correctAnswer: questionForm.correctAnswer,
                points: questionForm.points,
                explanation: questionForm.explanation
            };
            
            console.log('Sending question data:', questionData);
            await addQuestionToQuiz(currentQuizForQuestions._id, questionData);
            console.log('Question added successfully');
            
            toast.success('Question added successfully');
            
            // Refresh quiz data to see new question
            console.log('Fetching updated quiz...');
            const response = await getQuizById(currentQuizForQuestions._id);
            console.log('Updated quiz data:', response.data.data);
            setCurrentQuizForQuestions(response.data.data);
            
            setQuestionForm({
                question: '',
                type: 'multiple_choice',
                options: ['', '', '', ''],
                correctAnswer: 0,
                points: 20,
                explanation: ''
            });
            
            // Also refresh the main quiz list
            console.log('Refreshing quiz list...');
            await fetchQuizzes();
            console.log('Quiz list refreshed');
            
            // Close the modal after successful addition
            console.log('Closing modal');
            setShowQuestionModal(false);
            console.log('=== ADD QUESTION END ===');
        } catch (error) {
            console.error('ERROR adding question:', error);
            console.error('Error details:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Failed to add question');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Loading Quizzes...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quizzes</h3>
                    <p className="text-slate-500 font-medium">Create assessments and track student performance.</p>
                </div>
                <Button onClick={() => handleOpenQuizModal()} className="rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" /> Create Quiz
                </Button>
            </div>

            <div className="grid gap-6">
                {quizzes.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                                <ClipboardList className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-slate-900">No quizzes available</p>
                                <p className="text-slate-500 font-medium max-w-xs">Quizzes are the best way to evaluate student learning progress.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    quizzes.map((quiz) => (
                        <Card key={quiz._id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                                                <HelpCircle className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900">{quiz.title}</h4>
                                                <p className="text-slate-400 font-medium text-sm line-clamp-1">{quiz.description}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time Limit</p>
                                                <p className="text-sm font-bold text-slate-700">{quiz.timeLimit} Mins</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Questions</p>
                                                <p className="text-sm font-bold text-slate-700">{quiz.questionCount || 0}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pass Score</p>
                                                <p className="text-sm font-bold text-slate-700">{quiz.passingScore}%</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</p>
                                                <Badge className={quiz.isPublished ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'}>
                                                    {quiz.isPublished ? 'Live' : 'Draft'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            onClick={() => handleOpenQuestions(quiz)}
                                            className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 bg-slate-900 hover:bg-slate-800"
                                        >
                                            Manage Questions
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => handleOpenQuizModal(quiz)} className="flex-1 rounded-xl h-10"><Edit2 className="w-3.5 h-3.5" /></Button>
                                            <Button variant="outline" onClick={() => handleDeleteQuiz(quiz._id)} className="flex-1 rounded-xl h-10 hover:bg-red-50 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Quiz Create/Edit Modal */}
            {showQuizModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 p-8">
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingQuiz ? 'Edit Quiz' : 'New Quiz'}
                            </CardTitle>
                        </CardHeader>
                        <form onSubmit={handleQuizSubmit}>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quiz Title</label>
                                    <input
                                        type="text" required
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                        value={quizForm.title}
                                        onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quiz Number</label>
                                        <input
                                            type="number" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.quizNumber}
                                            onChange={(e) => setQuizForm({ ...quizForm, quizNumber: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Questions</label>
                                        <input
                                            type="number" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.totalQuestions}
                                            onChange={(e) => setQuizForm({ ...quizForm, totalQuestions: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Min)</label>
                                        <input
                                            type="number" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.duration}
                                            onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) || 30 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pass %</label>
                                        <input
                                            type="number"
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.passingScore}
                                            onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 70 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pts</label>
                                        <input
                                            type="number"
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.totalPoints}
                                            onChange={(e) => setQuizForm({ ...quizForm, totalPoints: parseInt(e.target.value) || 100 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                                        <input
                                            type="date" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.startDate}
                                            onChange={(e) => setQuizForm({ ...quizForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                                        <input
                                            type="date" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={quizForm.endDate}
                                            onChange={(e) => setQuizForm({ ...quizForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <input
                                        type="checkbox"
                                        id="isPublished"
                                        checked={quizForm.isPublished}
                                        onChange={(e) => setQuizForm({ ...quizForm, isPublished: e.target.checked })}
                                        className="w-5 h-5 rounded accent-primary"
                                    />
                                    <label htmlFor="isPublished" className="text-sm font-bold text-slate-700">Publish immediately to students</label>
                                </div>
                            </CardContent>
                            <div className="p-8 bg-slate-50 flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowQuizModal(false)} className="flex-1 rounded-2xl h-14">Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-2xl h-14 font-black">Save Quiz</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Question Management Modal */}
            {showQuestionModal && currentQuizForQuestions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-4xl max-h-[90vh] border-none shadow-2xl rounded-[3rem] overflow-hidden flex flex-col">
                        <CardHeader className="bg-slate-900 text-white p-10 flex flex-row items-center justify-between shrink-0">
                            <div className="space-y-2">
                                <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">Question Bank</Badge>
                                <CardTitle className="text-3xl font-black italic tracking-tighter">Managing Questions: {currentQuizForQuestions.title}</CardTitle>
                            </div>
                            <Button variant="ghost" onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white rounded-full h-12 w-12 p-0"><X className="w-6 h-6" /></Button>
                        </CardHeader>

                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Current Questions List */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-4">Current Questions ({currentQuizForQuestions.questions.length})</h5>
                                <div className="space-y-4">
                                    {currentQuizForQuestions.questions.map((q, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group animate-in slide-in-from-left duration-300">
                                            <p className="font-bold text-slate-900 mb-3">{idx + 1}. {q.questionText}</p>
                                            <div className="space-y-1">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className={`text-xs p-2 rounded-lg flex items-center gap-2 ${oIdx === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-600 font-bold' : 'text-slate-400'}`}>
                                                        {oIdx === q.correctAnswer ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-200" />}
                                                        {typeof opt === 'string' ? opt : opt.optionText}
                                                    </div>
                                                ))}
                                            </div>
                                            <Badge className="absolute top-4 right-4 bg-white text-[9px] font-black">{q.points} Pts</Badge>
                                        </div>
                                    ))}
                                    {currentQuizForQuestions.questions.length === 0 && (
                                        <div className="p-12 text-center text-slate-300 font-black uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2rem]">No questions added yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Add Question Form */}
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-b border-primary/10 pb-4">Add New Question</h5>
                                <form onSubmit={handleAddQuestion} className="space-y-6 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Question Text</label>
                                        <textarea
                                            required
                                            className="w-full p-6 rounded-2xl bg-white border border-slate-100 font-bold text-sm"
                                            value={questionForm.question}
                                            onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-bold">Options (Select radio for correct answer)</label>
                                        {questionForm.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="correctColor"
                                                    checked={questionForm.correctAnswer === idx}
                                                    onChange={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                                                    className="w-5 h-5 accent-primary"
                                                />
                                                <input
                                                    type="text"
                                                    required placeholder={`Option ${idx + 1}`}
                                                    className="flex-1 h-12 px-4 rounded-xl border border-slate-100 font-bold text-sm"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...questionForm.options];
                                                        newOpts[idx] = e.target.value;
                                                        setQuestionForm({ ...questionForm, options: newOpts });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">Add Question to Quiz</Button>
                                </form>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default QuizManager;
