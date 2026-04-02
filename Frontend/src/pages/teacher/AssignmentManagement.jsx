import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTeacherDashboard } from '../../api/teacher';
import { getAssignmentsByCourse, createAssignment, deleteAssignment, publishAssignment, closeAssignment } from '../../api/management';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Plus,
    FileText,
    Loader2,
    Eye,
    Edit2,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle,
    Users,
    BarChart3,
    Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import './AssignmentManagement.css';

const AssignmentManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        maxMarks: 100,
        submissionType: 'file',
        rubric: '',
        instructions: '',
        allowLateSubmission: true,
        latePenalty: 10,
    });

    useEffect(() => {
        const fetchCourses = async () => {
            const teacherId = user?.id || user?._id;
            if (!teacherId) return;

            try {
                const response = await getTeacherDashboard(teacherId);
                setCourses(response.data.data.coursesList || []);
                if (response.data.data.coursesList && response.data.data.coursesList.length > 0) {
                    setSelectedCourse(response.data.data.coursesList[0].courseId);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
                toast.error('Failed to load courses');
            }
        };

        if (user) {
            fetchCourses();
        }
    }, [user]);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!selectedCourse) return;

            try {
                setLoading(true);
                const response = await getAssignmentsByCourse(selectedCourse);
                setAssignments(response.data.data || []);
            } catch (error) {
                console.error('Error fetching assignments:', error);
                toast.error('Failed to load assignments');
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [selectedCourse]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                courseId: selectedCourse,
                ...formData,
                dueDate: new Date(formData.dueDate).toISOString(),
            };

            await createAssignment(payload);
            toast.success('Assignment created successfully!');
            setFormData({
                title: '',
                description: '',
                dueDate: '',
                maxMarks: 100,
                submissionType: 'file',
                rubric: '',
                instructions: '',
                allowLateSubmission: true,
                latePenalty: 10,
            });
            setShowCreateForm(false);

            // Refresh assignments
            const response = await getAssignmentsByCourse(selectedCourse);
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error creating assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to create assignment');
        }
    };

    const handlePublish = async (assignmentId) => {
        try {
            await publishAssignment(assignmentId);
            toast.success('Assignment published successfully!');
            const response = await getAssignmentsByCourse(selectedCourse);
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error publishing assignment:', error);
            toast.error('Failed to publish assignment');
        }
    };

    const handleClose = async (assignmentId) => {
        try {
            await closeAssignment(assignmentId);
            toast.success('Assignment closed successfully!');
            const response = await getAssignmentsByCourse(selectedCourse);
            setAssignments(response.data.data || []);
        } catch (error) {
            console.error('Error closing assignment:', error);
            toast.error('Failed to close assignment');
        }
    };

    const handleDelete = async (assignmentId) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                await deleteAssignment(assignmentId);
                toast.success('Assignment deleted successfully!');
                const response = await getAssignmentsByCourse(selectedCourse);
                setAssignments(response.data.data || []);
            } catch (error) {
                console.error('Error deleting assignment:', error);
                toast.error('Failed to delete assignment');
            }
        }
    };

    const filteredAssignments = assignments.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Published</Badge>;
            case 'draft':
                return <Badge className="bg-slate-100 text-slate-800"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
            case 'closed':
                return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Closed</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="assignment-management-container">
            {/* Header */}
            <div className="header-section">
                <div>
                    <h1 className="page-title">
                        Manage <span className="text-primary">Assignments</span>
                    </h1>
                    <p className="page-subtitle">
                        Create, publish, and grade assignments for your courses
                    </p>
                </div>
                <Button 
                    className="create-btn"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    <Plus className="w-5 h-5 mr-2" /> 
                    {showCreateForm ? 'Cancel' : 'New Assignment'}
                </Button>
            </div>

            {/* Course Selection */}
            <div className="course-selector">
                <select 
                    value={selectedCourse || ''}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="course-select"
                >
                    {courses.map((course) => (
                        <option key={course.courseId} value={course.courseId}>
                            {course.courseName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <Card className="create-form-card">
                    <CardHeader>
                        <CardTitle>Create New Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateAssignment} className="create-form">
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter assignment title"
                                    required
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter detailed description"
                                    required
                                    rows="4"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Instructions</label>
                                <textarea
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleInputChange}
                                    placeholder="Enter assignment instructions for students"
                                    rows="3"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Rubric</label>
                                <textarea
                                    name="rubric"
                                    value={formData.rubric}
                                    onChange={handleInputChange}
                                    placeholder="Enter grading rubric (e.g., Code quality: 30 points, Functionality: 40 points, etc.)"
                                    rows="3"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date *</label>
                                    <input
                                        type="datetime-local"
                                        name="dueDate"
                                        value={formData.dueDate}
                                        onChange={handleInputChange}
                                        required
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Max Marks *</label>
                                    <input
                                        type="number"
                                        name="maxMarks"
                                        value={formData.maxMarks}
                                        onChange={handleInputChange}
                                        min="1"
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Submission Type</label>
                                    <select
                                        name="submissionType"
                                        value={formData.submissionType}
                                        onChange={handleInputChange}
                                        className="form-input"
                                    >
                                        <option value="file">File Upload</option>
                                        <option value="text">Text</option>
                                        <option value="link">Link/URL</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Late Penalty (%)</label>
                                    <input
                                        type="number"
                                        name="latePenalty"
                                        value={formData.latePenalty}
                                        onChange={handleInputChange}
                                        min="0"
                                        max="100"
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="allowLateSubmission"
                                        checked={formData.allowLateSubmission}
                                        onChange={handleInputChange}
                                    />
                                    Allow Late Submissions
                                </label>
                            </div>

                            <div className="form-actions">
                                <Button type="submit" className="btn-primary">Create Assignment</Button>
                                <Button 
                                    type="button" 
                                    onClick={() => setShowCreateForm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="search-section">
                <Search className="search-icon" />
                <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Assignments List */}
            {loading ? (
                <div className="loading-container">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p>Loading assignments...</p>
                </div>
            ) : filteredAssignments.length === 0 ? (
                <div className="empty-state">
                    <FileText className="w-16 h-16 text-slate-300 mb-4" />
                    <h3>No assignments found</h3>
                    <p>Create your first assignment to get started</p>
                </div>
            ) : (
                <div className="assignments-grid">
                    {filteredAssignments.map((assignment) => (
                        <Card key={assignment._id} className="assignment-card">
                            <CardHeader>
                                <div className="card-header-row">
                                    <CardTitle className="assignment-title">{assignment.title}</CardTitle>
                                    {getStatusBadge(assignment.status)}
                                </div>
                                <p className="assignment-description">{assignment.description}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="assignment-stats">
                                    <div className="stat">
                                        <span className="stat-label">Max Marks</span>
                                        <span className="stat-value">{assignment.maxMarks}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Due Date</span>
                                        <span className="stat-value">{new Date(assignment.dueDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Type</span>
                                        <span className="stat-value">{assignment.submissionType}</span>
                                    </div>
                                </div>

                                <div className="assignment-actions">
                                    <Button 
                                        size="sm"
                                        variant="outline"
                                        onClick={() => navigate(`/assignments/${assignment._id}`)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> View
                                    </Button>

                                    {assignment.status === 'draft' && (
                                        <Button 
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handlePublish(assignment._id)}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" /> Publish
                                        </Button>
                                    )}

                                    {assignment.status === 'published' && (
                                        <>
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/assignments/${assignment._id}/submissions`)}
                                            >
                                                <Users className="w-4 h-4 mr-1" /> Submissions
                                            </Button>
                                            <Button 
                                                size="sm"
                                                className="bg-orange-600 hover:bg-orange-700"
                                                onClick={() => handleClose(assignment._id)}
                                            >
                                                <AlertCircle className="w-4 h-4 mr-1" /> Close
                                            </Button>
                                        </>
                                    )}

                                    {assignment.status === 'published' && (
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/assignments/${assignment._id}/analytics`)}
                                        >
                                            <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                                        </Button>
                                    )}

                                    {assignment.status === 'draft' && (
                                        <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/assignments/${assignment._id}/edit`)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                    )}

                                    <Button 
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700"
                                        onClick={() => handleDelete(assignment._id)}
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssignmentManagement;
