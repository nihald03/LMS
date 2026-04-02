import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCourseGrades, exportGradesToCSV } from '../../api/grading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Input } from '../../components/ui/input';
import {
    Download,
    Search,
    Loader2,
    ArrowLeft,
    TrendingUp,
    Users,
    Award,
    AlertCircle,
    BarChart3,
    Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GradeAnalytics = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const courseId = searchParams.get('course');

    const [loading, setLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState(false);
    const [filterGrade, setFilterGrade] = useState('all');
    const [lastRefresh, setLastRefresh] = useState(new Date());

    useEffect(() => {
        if (!courseId) {
            navigate('/teacher/courses');
            return;
        }
        fetchGrades();
    }, [courseId]);

    // Auto-refresh grades every 5 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchGrades();
        }, 5000);

        return () => clearInterval(interval);
    }, [courseId]);

    const fetchGrades = async () => {
        try {
            setLoading(true);
            const res = await getCourseGrades(courseId);
            const gradesData = res.data.data?.grades || res.data.grades || res.data || [];
            setGrades(Array.isArray(gradesData) ? gradesData : []);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error loading grades:', error);
            // Don't show error toast on auto-refresh
            if (grades.length === 0) {
                toast.error('Failed to load grades');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const res = await exportGradesToCSV(courseId);
            
            // Create blob and download
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grades_${courseId}_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Grades exported successfully');
        } catch (error) {
            console.error('Error exporting grades:', error);
            toast.error('Failed to export grades');
        } finally {
            setExporting(false);
        }
    };

    const filteredGrades = grades.filter(g => {
        const matchSearch = g.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchFilter = filterGrade === 'all' || g.letterGrade === filterGrade;
        return matchSearch && matchFilter;
    });

    const stats = {
        totalStudents: grades.length,
        avgScore: (grades.reduce((sum, g) => sum + (g.finalScore || 0), 0) / grades.length || 0).toFixed(2),
        passRate: ((grades.filter(g => (g.finalScore || 0) >= 50).length / grades.length) * 100 || 0).toFixed(1),
        gradeDistribution: {
            A: grades.filter(g => g.letterGrade === 'A').length,
            B: grades.filter(g => g.letterGrade === 'B').length,
            C: grades.filter(g => g.letterGrade === 'C').length,
            D: grades.filter(g => g.letterGrade === 'D').length,
            F: grades.filter(g => g.letterGrade === 'F').length,
        }
    };

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'A': return 'bg-green-100 text-green-800';
            case 'B': return 'bg-blue-100 text-blue-800';
            case 'C': return 'bg-yellow-100 text-yellow-800';
            case 'D': return 'bg-orange-100 text-orange-800';
            case 'F': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="space-y-4 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-slate-600 font-medium">Loading grade analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Grade Analytics</h1>
                    <p className="text-slate-600 font-medium">View and analyze student grades</p>
                    <p className="text-xs text-slate-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchGrades}
                        disabled={loading}
                        className="rounded-xl"
                    >
                        <TrendingUp className="w-5 h-5 mr-2" /> Refresh
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            <p className="text-slate-600 text-sm font-semibold">Total Students</p>
                            <p className="text-4xl font-black">{stats.totalStudents}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            <p className="text-slate-600 text-sm font-semibold">Average Score</p>
                            <p className="text-4xl font-black text-primary">{stats.avgScore}%</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            <p className="text-slate-600 text-sm font-semibold">Pass Rate</p>
                            <p className="text-4xl font-black text-green-600">{stats.passRate}%</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl">
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            <p className="text-slate-600 text-sm font-semibold">Grade Distribution</p>
                            <div className="flex items-center gap-2 text-xs">
                                <Badge className="bg-green-100 text-green-800">A: {stats.gradeDistribution.A}</Badge>
                                <Badge className="bg-blue-100 text-blue-800">B: {stats.gradeDistribution.B}</Badge>
                                <Badge className="bg-red-100 text-red-800">F: {stats.gradeDistribution.F}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search student by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 rounded-xl border-slate-200"
                    />
                </div>
                <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">All Grades</option>
                    <option value="A">Grade A</option>
                    <option value="B">Grade B</option>
                    <option value="C">Grade C</option>
                    <option value="D">Grade D</option>
                    <option value="F">Grade F</option>
                </select>
                <Button
                    onClick={handleExport}
                    disabled={exporting}
                    variant="outline"
                    className="rounded-xl"
                >
                    {exporting ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" /> Export CSV
                        </>
                    )}
                </Button>
            </div>

            {/* Grades Table */}
            <Card className="border-none shadow-lg rounded-3xl">
                <CardHeader className="border-b">
                    <CardTitle>Student Grades ({filteredGrades.length})</CardTitle>
                    <CardDescription>Complete grade records for all students</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredGrades.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center p-8">
                            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">No students found matching your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">Student</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">Score</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">Grade</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">GPA</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">Status</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900">Breakdown</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredGrades.map((grade) => (
                                        <tr key={grade._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-slate-900">{grade.studentName || 'Unknown'}</p>
                                                    <p className="text-xs text-slate-500 mt-1">{grade.studentEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <p className="font-bold text-lg text-slate-900">{grade.finalScore?.toFixed(1) || 0}%</p>
                                                    <Progress value={grade.finalScore || 0} className="h-2" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${getGradeColor(grade.letterGrade)} border-none font-bold text-lg px-4 py-2`}>
                                                    {grade.letterGrade || '-'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{(grade.gpa || 0).toFixed(2)}</p>
                                                <p className="text-xs text-slate-500 mt-1">out of 4.0</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {grade.finalScore >= 50 ? (
                                                    <Badge className="bg-green-100 text-green-800 border-none">
                                                        ✓ Passed
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-800 border-none">
                                                        ✗ Failed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs space-y-1 text-slate-600">
                                                    {grade.componentGrades && (
                                                        <>
                                                            <p>Quiz: {grade.componentGrades.quizzes?.toFixed(1) || '-'}%</p>
                                                            <p>Assign: {grade.componentGrades.assignments?.toFixed(1) || '-'}%</p>
                                                            <p>Attend: {grade.componentGrades.attendance?.toFixed(1) || '-'}%</p>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GradeAnalytics;
