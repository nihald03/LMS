import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseDetails, getCourseLectures } from '../../api/student';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Play,
    Clock,
    FileText,
    Search,
    ArrowLeft,
    CheckCircle2,
    Circle,
    Lock,
    ChevronRight,
    BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const CourseLectures = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('order'); // order, duration, title
    const [filteredLectures, setFilteredLectures] = useState([]);
    const [activeTab, setActiveTab] = useState('lectures'); // lectures or assignments

    useEffect(() => {
        fetchCourseAndLectures();
    }, [courseId]);

    // Filter and sort lectures
    useEffect(() => {
        let filtered = lectures.filter(lecture =>
            lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lecture.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort
        switch (sortBy) {
            case 'duration':
                filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0));
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'order':
            default:
                // Keep original order
                break;
        }

        setFilteredLectures(filtered);
    }, [lectures, searchTerm, sortBy]);

    const fetchCourseAndLectures = async () => {
        setLoading(true);
        try {
            const [courseRes, lecturesRes] = await Promise.all([
                getCourseDetails(courseId),
                getCourseLectures(courseId)
            ]);

            setCourse(courseRes.data.data.course);
            setLectures(lecturesRes.data.data.lectures || []);
        } catch (error) {
            console.error('Error fetching course data:', error);
            toast.error('Failed to load course lectures');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToLecture = (lectureId) => {
        navigate(`/learning/${courseId}/lecture/${lectureId}`);
    };

    const calculateProgress = () => {
        if (lectures.length === 0) return 0;
        const completedCount = lectures.filter(l => l.completed).length;
        return Math.round((completedCount / lectures.length) * 100);
    };

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading lectures...</p>
                </div>
            </div>
        );
    }

    const progress = calculateProgress();
    const totalDuration = lectures.reduce((sum, l) => sum + (l.duration || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
            {/* Header */}
            <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Go back"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-300" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white">{course?.title}</h1>
                                <p className="text-gray-400 mt-1">Lecture Content</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => handleNavigateToLecture(lectures[0]?._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={lectures.length === 0}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Start Learning
                        </Button>
                    </div>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm font-medium">Total Lectures</p>
                            <p className="text-2xl font-bold text-white mt-1">{lectures.length}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm font-medium">Progress</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{progress}%</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm font-medium">Total Duration</p>
                            <p className="text-2xl font-bold text-white mt-1">{formatDuration(totalDuration)}</p>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                            <p className="text-gray-400 text-sm font-medium">Completed</p>
                            <p className="text-2xl font-bold text-green-400 mt-1">
                                {lectures.filter(l => l.completed).length}/{lectures.length}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-300">Course Progress</p>
                            <p className="text-sm text-gray-400">{progress}% Complete</p>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-600">
                    <button
                        onClick={() => setActiveTab('lectures')}
                        className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                            activeTab === 'lectures'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            Lectures ({lectures.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                            activeTab === 'assignments'
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Assignments
                        </div>
                    </button>
                </div>

                {/* Lectures Tab Content */}
                {activeTab === 'lectures' && (
                <>
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search lectures..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            <option value="order">Order</option>
                            <option value="title">Title (A-Z)</option>
                            <option value="duration">Duration</option>
                        </select>
                    </div>
                </div>

                {/* Lectures List */}
                {filteredLectures.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">
                            {searchTerm ? 'No lectures match your search.' : 'No lectures available yet.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 mb-8">
                        {filteredLectures.map((lecture, index) => (
                            <div
                                key={lecture._id}
                                className="group bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden hover:border-blue-500/50 hover:bg-slate-700 transition-all duration-300 cursor-pointer"
                                onClick={() => handleNavigateToLecture(lecture._id)}
                            >
                                <div className="flex items-start gap-4 p-6">
                                    {/* Lecture Number and Thumbnail */}
                                    <div className="flex-shrink-0">
                                        <div className="relative w-24 h-24 bg-slate-600 rounded-lg overflow-hidden flex items-center justify-center">
                                            {/* Placeholder for thumbnail */}
                                            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                <Play className="w-8 h-8 text-blue-400" />
                                            </div>
                                            {/* Lecture number badge */}
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                                {index + 1}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                                                    {lecture.title}
                                                </h3>
                                                {lecture.description && (
                                                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                        {lecture.description}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                                        </div>

                                        {/* Meta Information */}
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                                            {/* Completion Status */}
                                            <div className="flex items-center gap-1">
                                                {lecture.completed ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        <span className="text-green-400">Completed</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Circle className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-400">Not started</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Duration */}
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatDuration(lecture.duration)}</span>
                                            </div>

                                            {/* Materials Count */}
                                            {lecture.materials && lecture.materials.length > 0 && (
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <FileText className="w-4 h-4" />
                                                    <span>{lecture.materials.length} material{lecture.materials.length !== 1 ? 's' : ''}</span>
                                                </div>
                                            )}

                                            {/* Locked Status */}
                                            {lecture.locked && (
                                                <Badge variant="secondary" className="bg-red-900/30 text-red-300 border-red-700">
                                                    <Lock className="w-3 h-3 mr-1" />
                                                    Locked
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNavigateToLecture(lecture._id);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Watch
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Encouragement Message */}
                {lectures.length > 0 && progress < 100 && (
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6 text-center">
                        <p className="text-gray-300">
                            You're {progress}% through the course! Keep up the great work. 
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            Complete {lectures.filter(l => !l.completed).length} more lecture{lectures.filter(l => !l.completed).length !== 1 ? 's' : ''} to finish.
                        </p>
                    </div>
                )}

                {progress === 100 && (
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-6 text-center">
                        <p className="text-green-300 font-semibold">🎉 Congratulations! You've completed all lectures!</p>
                        <p className="text-sm text-gray-400 mt-2">
                            You can now proceed to the next course or review any lectures.
                        </p>
                    </div>
                )}
                </>
                )}

                {/* Assignments Tab Content */}
                {activeTab === 'assignments' && (
                <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Course Assignments</h3>
                    <p className="text-gray-400 mb-6">View and submit assignments for this course</p>
                    <Button 
                        onClick={() => navigate(`/courses/${courseId}/assignments`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        View Assignments
                    </Button>
                </div>
                )}
            </div>
        </div>
    );
};

export default CourseLectures;
