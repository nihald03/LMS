import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCoursesCreatedByTeacher } from '../../api/teacher';
import { createQuiz, getQuizById, updateQuiz } from '../../api/quizzes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
    Plus, 
    Save, 
    X, 
    Edit2, 
    Trash2, 
    ChevronRight, 
    Clock, 
    BookOpen, 
    FileText 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import QuestionEditor from './QuestionEditor';

const TeacherQuizBuilder = () => {
    const { courseId, quizId } = useParams();
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(courseId || '');
    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        duration: 30,
        totalPoints: 100,
        passingScore: 40,
        totalQuestions: 0,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswers: true,
        allowMultipleAttempts: true,
        maxAttempts: 3,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        isPublished: false,
    });
    
    const [questions, setQuestions] = useState([]);
    const [showQuestionEditor, setShowQuestionEditor] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [bulkQuestionMode, setBulkQuestionMode] = useState(false);

    // Fetch teacher's courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await getCoursesCreatedByTeacher();
                setCourses(res.data.data || []);
                if (courseId) setSelectedCourse(courseId);
            } catch (error) {
                toast.error('Failed to load courses');
                console.error(error);
            }
        };
        fetchCourses();
    }, [courseId]);

    // Load existing quiz if editing
    useEffect(() => {
        if (quizId && selectedCourse) {
            const loadQuiz = async () => {
                try {
                    setLoading(true);
                    const res = await getQuizById(quizId);
                    const quiz = res.data.data;
                    setQuizData(quiz);
                    setQuestions(quiz.questions || []);
                } catch (error) {
                    toast.error('Failed to load quiz');
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            loadQuiz();
        }
    }, [quizId, selectedCourse]);

    const handleInputChange = (field, value) => {
        // Validate totalQuestions
        if (field === 'totalQuestions') {
            const numValue = parseInt(value) || 0;
            if (numValue < 0) {
                toast.error('Total questions cannot be negative');
                return; // Don't update state
            }
            if (numValue > 100) {
                toast.error('Maximum 100 questions allowed');
                return; // Don't update state
            }
            // Only update if validation passes
            setQuizData(prev => ({ ...prev, [field]: numValue }));
            return;
        }
        setQuizData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setShowQuestionEditor(true);
    };

    const handleEditQuestion = (question) => {
        setEditingQuestion(question);
        setShowQuestionEditor(true);
    };

    const handleSaveQuestion = (questionData) => {
        if (editingQuestion) {
            // Update existing question
            setQuestions(questions.map(q => q._id === editingQuestion._id ? { ...editingQuestion, ...questionData } : q));
            toast.success('Question updated');
        } else {
            // Add new question
            const newQuestion = {
                _id: `temp_${Date.now()}`,
                questionNumber: questions.length + 1,
                ...questionData
            };
            setQuestions([...questions, newQuestion]);
            toast.success('Question added');
        }
        
        // Clear editing state
        setEditingQuestion(null);
        
        // Keep modal open in bulk mode, close otherwise
        if (!bulkQuestionMode) {
            setShowQuestionEditor(false);
        }
    };

    const handleDeleteQuestion = (questionId) => {
        if (window.confirm('Delete this question?')) {
            setQuestions(questions.filter(q => q._id !== questionId));
            toast.success('Question deleted');
        }
    };

    const handleSaveQuiz = async () => {
        if (!selectedCourse) {
            toast.error('Please select a course');
            return;
        }
        if (!quizData.title) {
            toast.error('Quiz title is required');
            return;
        }
        if (questions.length === 0) {
            toast.error('Add at least one question');
            return;
        }
        
        // CRITICAL: Check if totalQuestions is set and validate match
        if (quizData.totalQuestions && quizData.totalQuestions > 0) {
            if (questions.length !== quizData.totalQuestions) {
                toast.error(`Mismatch! You set ${quizData.totalQuestions} total questions but added ${questions.length}. Please adjust the total questions field or add/remove questions.`);
                return;
            }
        }

        try {
            setIsSaving(true);
            const payload = {
                ...quizData,
                courseId: selectedCourse,
                totalQuestions: questions.length,
                questions: questions.map(q => q._id).filter(id => !id.startsWith('temp_'))
            };

            if (quizId) {
                await updateQuiz(quizId, payload);
                toast.success('Quiz updated successfully');
            } else {
                const res = await createQuiz(payload);
                toast.success('Quiz created successfully');
                navigate(`/teacher/quizzes/${res.data.data._id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save quiz');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-12 h-12"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-12 space-y-8">
            {/* Header */}
            <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight">Quiz Builder</h1>
                <p className="text-slate-600 text-lg font-medium">Create and manage assessment questions</p>
            </div>

            {/* Course Selection */}
            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader className="pb-4">
                    <CardTitle>Select Course</CardTitle>
                </CardHeader>
                <CardContent>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={!!quizId}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">Choose a course...</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.courseName} ({course.courseCode})
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            {selectedCourse && (
                <>
                    {/* Quiz Details */}
                    <Card className="border-none shadow-lg rounded-3xl">
                        <CardHeader>
                            <CardTitle>Quiz Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Quiz Title *</label>
                                    <Input
                                        value={quizData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Enter quiz title"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Duration (minutes) *</label>
                                    <Input
                                        type="number"
                                        value={quizData.duration}
                                        onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                                        min="1"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Total Points</label>
                                    <Input
                                        type="number"
                                        value={quizData.totalPoints}
                                        onChange={(e) => handleInputChange('totalPoints', parseInt(e.target.value))}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Passing Score (%)</label>
                                    <Input
                                        type="number"
                                        value={quizData.passingScore}
                                        onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value))}
                                        min="0"
                                        max="100"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Start Date</label>
                                    <Input
                                        type="date"
                                        value={quizData.startDate}
                                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">End Date</label>
                                    <Input
                                        type="date"
                                        value={quizData.endDate}
                                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea
                                    value={quizData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Quiz description"
                                    rows="4"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={quizData.shuffleQuestions}
                                        onChange={(e) => handleInputChange('shuffleQuestions', e.target.checked)}
                                    />
                                    <span className="text-sm font-bold">Shuffle Questions</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={quizData.showCorrectAnswers}
                                        onChange={(e) => handleInputChange('showCorrectAnswers', e.target.checked)}
                                    />
                                    <span className="text-sm font-bold">Show Correct Answers</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={quizData.allowMultipleAttempts}
                                        onChange={(e) => handleInputChange('allowMultipleAttempts', e.target.checked)}
                                    />
                                    <span className="text-sm font-bold">Multiple Attempts</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card className="border-none shadow-lg rounded-3xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="space-y-2">
                                <CardTitle>Questions ({questions.length})</CardTitle>
                                {quizData.totalQuestions > 0 && questions.length !== quizData.totalQuestions && (
                                    <div className="text-sm text-red-600 font-bold">
                                        ⚠️ You set {quizData.totalQuestions} total questions but added {questions.length}. Please adjust!
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setBulkQuestionMode(!bulkQuestionMode)}
                                    variant={bulkQuestionMode ? "default" : "outline"}
                                    className="rounded-xl"
                                >
                                    {bulkQuestionMode ? '✓ Bulk Mode' : 'Bulk Mode'}
                                </Button>
                                <Button
                                    onClick={handleAddQuestion}
                                    className="rounded-xl"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Add Question
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {questions.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p>No questions added yet. Click "Add Question" to get started.</p>
                                    <p className="text-xs mt-2">Use "Bulk Mode" to add multiple questions without closing the modal</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map((question, idx) => (
                                        <div key={question._id} className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <Badge className="mb-2 bg-primary/20 text-primary border-none">
                                                        Q{idx + 1} • {question.questionType?.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <p className="font-bold text-slate-900">{question.questionText}</p>
                                                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                                                        <span>Options: {question.options?.length || 0}</span>
                                                        <span>Points: {question.points || 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEditQuestion(question)}
                                                        className="rounded-lg"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteQuestion(question._id)}
                                                        className="rounded-lg text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Question Editor Modal */}
                    {showQuestionEditor && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl">
                                <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 border-b">
                                    <div>
                                        <CardTitle>
                                            {editingQuestion ? 'Edit Question' : 'Add Question'}
                                        </CardTitle>
                                        {bulkQuestionMode && (
                                            <p className="text-xs text-slate-500 mt-1">💡 Bulk Mode: Add multiple questions without closing</p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowQuestionEditor(false)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <QuestionEditor
                                        question={editingQuestion}
                                        onSave={handleSaveQuestion}
                                        onCancel={() => !bulkQuestionMode && setShowQuestionEditor(false)}
                                        bulkMode={bulkQuestionMode}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end gap-4 pt-8">
                        <Button
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="rounded-xl px-8 h-12 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveQuiz}
                            disabled={isSaving}
                            className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Quiz'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherQuizBuilder;
