import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getAssignmentSubmissions, gradeSubmission, getStudentGrade } from '../../api/grading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import {
    AlertCircle,
    FileText,
    Check,
    X,
    Download,
    MessageSquare,
    Save,
    ArrowLeft,
    Loader2,
    User,
    Calendar,
    ClipboardCheck,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssignmentGrading = () => {
    const { assignmentId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const courseId = searchParams.get('course');

    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [grading, setGrading] = useState(false);
    const [gradeData, setGradeData] = useState({
        score: '',
        feedback: ''
    });
    const [studentGrades, setStudentGrades] = useState({});

    useEffect(() => {
        fetchSubmissions();
    }, [assignmentId]);

    const fetchSubmissions = async () => {
    try {
        setLoading(true);

        // 🛑 PROTECTION CHECK
        if (!assignmentId || assignmentId === '[object Object]') {
            console.error("❌ INVALID assignmentId:", assignmentId);
            toast.error("Invalid assignment selected");
            navigate('/teacher/grading');
            return;
        }

        console.log("✅ Fetching submissions for:", assignmentId);

        const res = await getAssignmentSubmissions(assignmentId);
        setSubmissions(res.data.data || []);
        setCurrentIndex(0);

        } catch (error) {
            console.error('Error loading submissions:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const currentSubmission = submissions[currentIndex];
    const isGraded = currentSubmission?.status === 'graded';

    useEffect(() => {
        if (currentSubmission) {
            if (isGraded) {
                setGradeData({
                    score: currentSubmission.grade?.marks || '',
                    feedback: currentSubmission.feedback || ''
                });
            } else {
                setGradeData({
                    score: '',
                    feedback: ''
                });
            }
        }
    }, [currentIndex, submissions]);

    const handleGradeSubmission = async () => {
        if (!gradeData.score) {
            toast.error('Please enter a score');
            return;
        }

        const score = parseFloat(gradeData.score);
        if (score < 0 || score > 100) {
            toast.error('Score must be between 0 and 100');
            return;
        }

        try {
            setGrading(true);
            await gradeSubmission(currentSubmission._id, {
                marks: score,
                feedback: gradeData.feedback
            });

            toast.success('Submission graded successfully');
            
            // Update submission locally
            const updatedSubmissions = [...submissions];
            updatedSubmissions[currentIndex] = {
                ...updatedSubmissions[currentIndex],
                score: score,
                feedback: gradeData.feedback,
                status: 'graded',
                gradedAt: new Date()
            };
            setSubmissions(updatedSubmissions);

            // Move to next ungraded or stay
            if (currentIndex < submissions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            }
        } catch (error) {
            console.error('Error grading submission:', error);
            toast.error(error.response?.data?.message || 'Failed to grade submission');
        } finally {
            setGrading(false);
        }
    };

    const gradedCount = submissions.filter(s => s.status === 'graded').length;
    const completionPercent = (gradedCount / submissions.length) * 100;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="space-y-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-slate-600 font-medium">Loading submissions...</p>
                </div>
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <Button
                    variant="outline"
                    onClick={() => navigate(`/teacher/grading?course=${courseId}`)}
                    className="mb-8 rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
                <Card className="border-none shadow-lg rounded-3xl">
                    <CardContent className="p-12 text-center space-y-4">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto" />
                        <h3 className="text-xl font-bold text-slate-900">No Submissions Yet</h3>
                        <p className="text-slate-600">Students haven't submitted this assignment yet.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/teacher/grading?course=${courseId}`)}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black">Grade Submissions</h1>
                        <p className="text-slate-600 text-sm mt-1">Assignment grading interface</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <Card className="border-none shadow-lg rounded-2xl">
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-900">Progress</span>
                            <span className="text-sm text-slate-600">{gradedCount} of {submissions.length} graded</span>
                        </div>
                        <Progress value={completionPercent} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* Grading Interface */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Submissions List */}
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-lg rounded-2xl">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg">Submissions ({submissions.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                            <div className="divide-y">
                                {submissions.map((submission, idx) => (
                                    <div
                                        key={submission._id}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`p-4 cursor-pointer transition-colors ${
                                            currentIndex === idx
                                                ? 'bg-primary/10 border-l-4 border-primary'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-slate-900 truncate">
                                                    {submission.studentId?.firstName && submission.studentId?.lastName
                                                        ? `${submission.studentId.firstName} ${submission.studentId.lastName}`
                                                        : submission.studentId?.email || 'Student'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'No date'}
                                                </p>
                                            </div>
                                            {submission.status === 'graded' ? (
                                                <Badge className="bg-green-100 text-green-800 border-none flex-shrink-0">
                                                    ✓
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-orange-100 text-orange-800 border-none flex-shrink-0">
                                                    ⏳
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Grading Form */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-lg rounded-2xl">
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    <User className="inline w-5 h-5 mr-2" />
                                    {currentSubmission?.studentId?.firstName && currentSubmission?.studentId?.lastName
                                        ? `${currentSubmission.studentId.firstName} ${currentSubmission.studentId.lastName}`
                                        : currentSubmission?.studentId?.email || 'Student'}
                                </CardTitle>
                                <span className="text-xs text-slate-500">
                                    {currentIndex + 1} of {submissions.length}
                                </span>
                            </div>
                            <CardDescription className="mt-2">
                                Submitted: {currentSubmission?.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString() : 'N/A'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {/* Submission Content */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Submission Content
                                </h4>
                                {currentSubmission?.submissionFile?.url ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-600">
                                            <a 
                                            href={`http://localhost:5000${currentSubmission.submissionFile.url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            >
                                                {currentSubmission.submissionFile.filename || 'Download'}
                                            </a>
                                        </p>
                                        <Button variant="outline" className="rounded-xl" asChild>
                                            <a 
                                                href={`http://localhost:5000${currentSubmission.submissionFile.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                >
                                                <Eye className="w-4 h-4 mr-2" /> View File
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 italic">No file attached</p>
                                )}
                                {currentSubmission?.submissionText && (
                                    <div className="mt-4 p-4 bg-white rounded border border-slate-200">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                            {currentSubmission.submissionText}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Grading Form */}
                            <div className="space-y-6">
                                {/* Score Input */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-3">
                                        Score (0-100)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={gradeData.score}
                                        onChange={(e) => setGradeData(prev => ({ ...prev, score: e.target.value }))}
                                        placeholder="Enter score"
                                        className="rounded-xl text-lg font-semibold"
                                        disabled={isGraded && !grading}
                                    />
                                </div>

                                {/* Feedback */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-3">
                                        <MessageSquare className="inline w-4 h-4 mr-2" />
                                        Feedback (Optional)
                                    </label>
                                    <textarea
                                        value={gradeData.feedback}
                                        onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                                        placeholder="Provide constructive feedback to the student..."
                                        rows="6"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={isGraded && !grading}
                                    />
                                </div>

                                {isGraded && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-green-900 text-sm">Already Graded</p>
                                            <p className="text-xs text-green-800 mt-1">Graded on {new Date(currentSubmission.gradedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentIndex(currentIndex - 1)}
                                    disabled={currentIndex === 0}
                                    className="rounded-xl"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" /> Previous
                                </Button>
                                <Button
                                    onClick={handleGradeSubmission}
                                    disabled={grading || isGraded}
                                    className="flex-1 rounded-xl"
                                >
                                    {grading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                                        </>
                                    ) : isGraded ? (
                                        <>
                                            <Check className="w-5 h-5 mr-2" /> Already Graded
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" /> Save Grade
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentIndex(currentIndex + 1)}
                                    disabled={currentIndex === submissions.length - 1}
                                    className="rounded-xl"
                                >
                                    Next <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AssignmentGrading;
