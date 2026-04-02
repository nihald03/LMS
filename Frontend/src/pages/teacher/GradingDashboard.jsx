import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAssignmentSubmissions, gradeSubmission, getStudentGrade, getPendingGradingCount } from '../../api/grading';
import { getAssignmentsByCourse } from '../../api/management';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import {
    CheckCircle,
    Clock,
    AlertCircle,
    FileText,
    Download,
    Filter,
    Search,
    Loader2,
    ArrowLeft,
    Eye,
    Edit2,
    ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GradingDashboard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const courseId = searchParams.get('course');

    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [filterStatus, setFilterStatus] = useState('submitted');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
       if (!courseId) {
            console.warn("⚠️ No courseId, stopping loader");
            if (!courseId) {
                console.warn("⚠️ No courseId, stopping loader");
                setLoading(false);
                return;
            }
            return;
        }
        fetchData();
    }, [courseId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignRes, countRes] = await Promise.all([
                getAssignmentsByCourse(courseId),
                getPendingGradingCount(courseId)
            ]);
            
            const assignmentsData = assignRes.data.data?.assignments || assignRes.data.data || [];
            console.log("ASSIGNMENTS DATA:", assignmentsData);
            setAssignments(assignmentsData);
            // Backend returns array of pending submissions, derive count from length
            const pendingSubmissions = countRes.data.data || [];
            const pendingCount = Array.isArray(pendingSubmissions) ? pendingSubmissions.length : 0;
            setPendingCount(pendingCount);
        } catch (error) {
            console.error('Error loading grading dashboard:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const filteredAssignments = assignments.filter(a => {
        const matchSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchSearch;
    });

    const gradedCount = assignments.filter(a => a.isGraded)?.length || 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="space-y-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-slate-600 font-medium">Loading assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Grading Dashboard</h1>
                    <p className="text-slate-600 font-medium">Review and grade student assignments</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="rounded-xl"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back
                </Button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-sm font-semibold">Total Assignments</p>
                                <p className="text-4xl font-black mt-2">{assignments.length}</p>
                            </div>
                            <FileText className="w-12 h-12 text-blue-500/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-sm font-semibold">Pending Grading</p>
                                <p className="text-4xl font-black mt-2 text-orange-600">{pendingCount}</p>
                            </div>
                            <Clock className="w-12 h-12 text-orange-500/20" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 text-sm font-semibold">Graded</p>
                                <p className="text-4xl font-black mt-2 text-green-600">{gradedCount}</p>
                                <Progress value={(gradedCount / assignments.length) * 100} className="mt-2" />
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-500/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search assignments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 rounded-xl border-slate-200"
                    />
                </div>
            </div>

            {/* Assignments List */}
            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader className="border-b">
                    <CardTitle>Assignments</CardTitle>
                    <CardDescription>Click to grade submissions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No assignments found</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredAssignments.map((assignment) => (
                                <div
                                    key={assignment._id}
                                    className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                                    onClick={() => {
                                        console.log("CLICKED ASSIGNMENT:", assignment);
                                        console.log("ASSIGNMENT ID:", assignment._id);

                                        navigate(`/teacher/grading/assignment/${assignment._id}?course=${courseId}`);
                                    }}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-900">{assignment.title}</h3>
                                            {assignment.submissionCount > 0 && assignment.gradedCount < assignment.submissionCount && (
                                                <Badge className="bg-orange-100 text-orange-800 border-none">
                                                    {assignment.submissionCount - (assignment.gradedCount || 0)} Pending
                                                </Badge>
                                            )}
                                            {assignment.submissionCount > 0 && assignment.gradedCount === assignment.submissionCount && (
                                                <Badge className="bg-green-100 text-green-800 border-none">
                                                    ✓ All Graded
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2">{assignment.description}</p>
                                        <div className="flex gap-6 mt-3 text-xs text-slate-500">
                                            <span>📤 {assignment.submissionCount || 0} Submissions</span>
                                            <span>✅ {assignment.gradedCount || 0} Graded</span>
                                            <span>📅 Deadline: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No deadline'}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GradingDashboard;
