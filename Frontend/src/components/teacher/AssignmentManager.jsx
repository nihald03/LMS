import React, { useState, useEffect } from 'react';
import {
    getAssignmentsByCourse,
    createAssignment,
    updateAssignment,
    deleteAssignment
} from '../../api/management';
import api from '../../api/api';
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
    FileText,
    Edit2,
    Trash2,
    Calendar,
    Users,
    CheckCircle2,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AssignmentManager = ({ courseId }) => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignmentNumber: 1,
        totalPoints: 100,
        dueDate: '',
        submissionType: 'file',
        allowedFormats: ['pdf', 'doc', 'docx'],
        instructions: ''
    });

    useEffect(() => {
        fetchAssignments();
    }, [courseId]);

    const fetchAssignments = async () => {
        try {
            // Use the assignments API to fetch by course (route: /assignments/course/:courseId)
            const response = await getAssignmentsByCourse(courseId);
            setAssignments(response.data.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast.error('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (assignment = null) => {
        if (assignment) {
            setEditingAssignment(assignment);
            setFormData({
                title: assignment.title,
                description: assignment.description || '',
                assignmentNumber: assignment.assignmentNumber || 1,
                totalPoints: assignment.totalPoints || 100,
                dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
                submissionType: assignment.submissionType || 'file',
                allowedFormats: assignment.allowedFormats || ['pdf', 'doc', 'docx'],
                instructions: assignment.instructions || ''
            });
        } else {
            setEditingAssignment(null);
            // Calculate next assignment number based on existing assignments
            const nextNumber = assignments.length > 0 
                ? Math.max(...assignments.map(a => a.assignmentNumber || 0)) + 1 
                : 1;
            setFormData({
                title: '',
                description: '',
                assignmentNumber: nextNumber,
                totalPoints: 100,
                dueDate: '',
                submissionType: 'file',
                allowedFormats: ['pdf', 'doc', 'docx'],
                instructions: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAssignment) {
                await updateAssignment(editingAssignment._id, formData);
                toast.success('Assignment updated');
            } else {
                await createAssignment({ ...formData, courseId });
                toast.success('Assignment created');
            }
            setShowModal(false);
            fetchAssignments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this assignment?')) return;
        try {
            await deleteAssignment(id);
            toast.success('Assignment deleted');
            fetchAssignments();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Loading Assignments...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Assignments</h3>
                    <p className="text-slate-500 font-medium">Create tasks and projects for your students.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" /> Create Assignment
                </Button>
            </div>

            <div className="grid gap-6">
                {assignments.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-slate-900">No assignments created</p>
                                <p className="text-slate-500 font-medium max-w-xs">Assignments help students apply their knowledge in practice.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    assignments.map((assignment) => (
                        <Card key={assignment._id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex">
                                    <div className="w-4 bg-primary group-hover:w-6 transition-all duration-300"></div>
                                    <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="space-y-4 flex-1">
                                            <div className="space-y-1">
                                                <h4 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">{assignment.title}</h4>
                                                <p className="text-slate-500 font-medium line-clamp-1">{assignment.description}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Users className="w-4 h-4 text-primary" />
                                                    {assignment.submissionCount || 0} Submissions
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    {assignment.maxScore} Max Pts
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleOpenModal(assignment)}
                                                className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:bg-slate-50"
                                            >
                                                <Edit2 className="w-4 h-4 text-slate-600" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(assignment._id)}
                                                className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:bg-red-50 hover:text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button className="rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest bg-slate-900 group">
                                                Grade <ChevronRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 p-8">
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingAssignment ? 'Edit Assignment' : 'New Assignment'}
                            </CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                                    <input
                                        type="text" required
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                    <textarea
                                        rows="2" required
                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment #</label>
                                        <input
                                            type="number" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={formData.assignmentNumber}
                                            onChange={(e) => setFormData({ ...formData, assignmentNumber: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Points</label>
                                        <input
                                            type="number" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={formData.totalPoints}
                                            onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 100 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</label>
                                        <input
                                            type="date" required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Submission Type</label>
                                        <select
                                            required
                                            className="w-full h-14 px-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                            value={formData.submissionType}
                                            onChange={(e) => setFormData({ ...formData, submissionType: e.target.value })}
                                        >
                                            <option value="file">File Upload</option>
                                            <option value="text">Text Submission</option>
                                            <option value="url">URL Submission</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions</label>
                                    <textarea
                                        rows="3"
                                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold"
                                        value={formData.instructions}
                                        onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                        placeholder="Provide clear instructions for students"
                                    />
                                </div>
                            </CardContent>
                            <div className="p-8 bg-slate-50 flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl h-14 font-black">Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-2xl h-14 font-black shadow-xl shadow-primary/20">Save Assignment</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AssignmentManager;
