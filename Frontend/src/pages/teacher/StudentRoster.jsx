import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { getClassProgressSummary, getTeacherDashboard } from '../../api/teacher';
import {
    Users,
    Search,
    Filter,
    Mail,
    MoreHorizontal,
    Loader2,
    BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toast } from 'react-hot-toast';

const StudentRoster = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const initialCourseId = searchParams.get('course');

    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            const teacherId = user?.id || user?._id;
            if (!teacherId) return;

            try {
                const response = await getTeacherDashboard(teacherId);
                const coursesList = response.data.data.coursesList || [];
                setCourses(coursesList);
                if (!selectedCourse && coursesList.length > 0) {
                    setSelectedCourse(coursesList[0].courseId);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };

        if (user) {
            fetchCourses();
        }
    }, [user]);

    useEffect(() => {
        const fetchRoster = async () => {
            if (!selectedCourse) return;
            setLoading(true);
            try {
                const response = await getClassProgressSummary(selectedCourse, page);
                setStudents(response.data.data.studentsSummary || []);
                setPagination(response.data.data.pagination);
            } catch (error) {
                console.error('Error fetching roster:', error);
                toast.error('Failed to load student roster');
            } finally {
                setLoading(false);
            }
        };

        fetchRoster();
    }, [selectedCourse, page]);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
                        Student <span className="text-primary">Roster</span>
                    </h1>
                    <p className="text-slate-500 font-medium font-serif italic">
                        View and communicate with students enrolled in your courses
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl font-black py-6 border-slate-200">
                        <Mail className="w-4 h-4 mr-2" /> Message All
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2 border-none shadow-sm bg-white rounded-3xl overflow-hidden px-4">
                    <div className="flex items-center gap-2 h-14">
                        <Search className="w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Find a student by name..."
                            className="bg-transparent border-none focus-visible:ring-0 text-lg font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <select
                            value={selectedCourse}
                            onChange={(e) => {
                                setSelectedCourse(e.target.value);
                                setPage(1); // Reset page on course change
                            }}
                            className="w-full h-14 bg-white border border-slate-100 rounded-3xl px-12 font-bold appearance-none focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                            {courses.map(c => (
                                <option key={c.courseId} value={c.courseId}>{c.courseName}</option>
                            ))}
                        </select>
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    </div>
                    <Button variant="outline" className="h-14 w-14 rounded-3xl border-slate-100">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>
            </div>

            {/* Roster Table */}
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-slate-500 font-medium">Updating roster list...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="text-left py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Profile</th>
                                        <th className="text-center py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="text-center py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                        <th className="text-center py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Current Grade</th>
                                        <th className="text-right py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black group-hover:bg-primary transition-colors duration-300">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors text-lg">{student.name}</p>
                                                        <p className="text-xs text-slate-400 font-medium">ID: {student.studentId.substring(0, 12)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <Badge className={`rounded-full font-black uppercase text-[10px] px-4 py-1.5 ${student.status === 'active' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                                                    {student.status}
                                                </Badge>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <div className="space-y-1 font-black text-slate-700">
                                                    <p>{student.progress}%</p>
                                                    <div className="w-16 h-1 mx-auto bg-slate-100 rounded-full overflow-hidden">
                                                        <div style={{ width: `${student.progress}%` }} className="h-full bg-primary"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <p className="font-black text-slate-900 text-xl">{student.currentGrade || 'N/A'}</p>
                                            </td>
                                            <td className="py-6 px-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                                                        <Mail className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                                    </Button>
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

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 pb-8">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="rounded-xl font-bold"
                    >
                        Previous
                    </Button>
                    <span className="text-sm font-black text-slate-400">
                        Page {page} of {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        disabled={page === pagination.pages}
                        onClick={() => setPage(page + 1)}
                        className="rounded-xl font-bold"
                    >
                        Next
                    </Button>
                </div>
            )}

            {!loading && filteredStudents.length === 0 && (
                <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                    <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No students matching your search</h3>
                </div>
            )}
        </div>
    );
};

export default StudentRoster;
