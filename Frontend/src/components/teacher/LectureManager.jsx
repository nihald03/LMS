import React, { useState, useEffect } from 'react';
import {
    getLecturesByCourse,
    createLecture,
    updateLecture,
    deleteLecture,
    publishLecture
} from '../../api/management';
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
    Video,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Clock,
    Layers,
    MoreVertical,
    Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import VideoUploadModal from '../ui/VideoUploadModal';
import VideoPlayer from '../ui/VideoPlayer';
import AddQuestionModal from './AddQuestionModal';
import QuestionAnalytics from './QuestionAnalytics';

const LectureManager = ({ courseId }) => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
    const [selectedLectureForUpload, setSelectedLectureForUpload] = useState(null);
    const [editingLecture, setEditingLecture] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        lectureNumber: '',
        duration: 60,
        videoUrl: ''
    });
    const [token, setToken] = useState(null);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [selectedLectureId, setSelectedLectureId] = useState(null);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [selectedAnalyticsLectureId, setSelectedAnalyticsLectureId] = useState(null);

    useEffect(() => {
        // Get JWT token from localStorage
        const storedToken = localStorage.getItem('token');
        setToken(storedToken);
        fetchLectures();
    }, [courseId]);

    const fetchLectures = async () => {
        try {
            const response = await getLecturesByCourse(courseId);
            setLectures(response.data.data);
        } catch (error) {
            console.error('Error fetching lectures:', error);
            toast.error('Failed to load lectures');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lecture = null) => {
        if (lecture) {
            setEditingLecture(lecture);
            setFormData({
                title: lecture.title,
                description: lecture.description || '',
                lectureNumber: lecture.lectureNumber,
                duration: lecture.duration || 60,
                videoUrl: lecture.videoUrl || ''
            });
        } else {
            setEditingLecture(null);
            // Calculate next lecture number based on existing lectures
            const nextNumber = lectures.length > 0 
                ? Math.max(...lectures.map(l => l.lectureNumber || 0)) + 1 
                : 1;
            setFormData({
                title: '',
                description: '',
                lectureNumber: nextNumber,
                duration: 60,
                videoUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLecture) {
                await updateLecture(editingLecture._id, formData);
                toast.success('Lecture updated successfully');
                setShowModal(false);
                fetchLectures();
            } else {
                // Create new lecture
                const response = await createLecture({ ...formData, courseId });
                const newLectureId = response.data.data._id;
                toast.success('Lecture created successfully');
                
                // Show video upload modal for new lecture
                setSelectedLectureForUpload(newLectureId);
                setShowVideoUploadModal(true);
                setShowModal(false);
                fetchLectures();
            }
        } catch (error) {
            console.error('Error saving lecture:', error);
            toast.error(error.response?.data?.message || 'Failed to save lecture');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lecture?')) return;
        try {
            await deleteLecture(id);
            toast.success('Lecture deleted successfully');
            fetchLectures();
        } catch (error) {
            toast.error('Failed to delete lecture');
        }
    };

    const handlePublishToggle = async (id) => {
        try {
            await updateLecture(id, { isPublished: !lectures.find(l => l._id === id).isPublished });
            toast.success('Publish status updated');
            fetchLectures();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleVideoUploadSuccess = (metadata) => {
        toast.success('Video uploaded successfully!');
        setShowVideoUploadModal(false);
        setSelectedLectureForUpload(null);
        fetchLectures();
    };

    const handleUploadVideo = (lectureId) => {
        setSelectedLectureForUpload(lectureId);
        setShowVideoUploadModal(true);
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-slate-400">Loading Lectures...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lectures</h3>
                    <p className="text-slate-500 font-medium">Manage your course video content and materials.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="rounded-2xl font-black text-xs uppercase tracking-widest px-8 h-14 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" /> Add Lecture
                </Button>
            </div>

            <div className="grid gap-4">
                {lectures.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center">
                                <Video className="w-8 h-8 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-slate-900">No lectures yet</p>
                                <p className="text-slate-500 font-medium max-w-xs">Start building your course curriculum by adding your first lecture.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    lectures.map((lecture) => (
                        <Card key={lecture._id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex items-center">
                                    <div className="w-20 h-20 bg-slate-100 flex items-center justify-center border-r border-slate-50 font-black text-2xl text-slate-300">
                                        {lecture.lectureNumber}
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-xl font-bold text-slate-900">{lecture.title}</h4>
                                                {lecture.isPublished ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3 uppercase tracking-widest">Published</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-400 border-slate-200 font-black text-[10px] px-3 uppercase tracking-widest">Draft</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {lecture.duration} Mins</span>
                                                <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> {lecture.materials?.length || 0} Materials</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleUploadVideo(lecture._id)}
                                                className="rounded-xl hover:bg-blue-50"
                                                title="Upload Video"
                                            >
                                                <Upload className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePublishToggle(lecture._id)}
                                                className="rounded-xl hover:bg-slate-100"
                                            >
                                                {lecture.isPublished ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-primary" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenModal(lecture)}
                                                className="rounded-xl hover:bg-slate-100"
                                            >
                                                <Edit2 className="w-4 h-4 text-slate-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedLectureId(lecture._id);
                                                    setShowAddQuestion(true);
                                                }}
                                                className="rounded-xl hover:bg-emerald-50"
                                                title="Add Question"
                                            >
                                                <Plus className="w-4 h-4 text-emerald-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setSelectedAnalyticsLectureId(lecture._id);
                                                    setShowAnalytics(true);
                                                }}
                                                className="rounded-xl hover:bg-blue-50"
                                                title="View Analytics"
                                            >
                                                <span className="text-lg">📊</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(lecture._id)}
                                                className="rounded-xl hover:bg-red-50 text-red-500"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Modal - Simplified version using basic HTML/CSS as placeholder for shadcn Dialog if not available/too complex for single tool */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="bg-slate-50 p-8">
                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingLecture ? 'Edit Lecture' : 'New Lecture'}
                            </CardTitle>
                            <CardDescription className="font-medium">Enter the lecture details below.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lecture #</label>
                                        <input
                                            type="number"
                                            required
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                            value={formData.lectureNumber}
                                            onChange={(e) => setFormData({ ...formData, lectureNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (Mins)</label>
                                        <input
                                            type="number"
                                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Video URL</label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                        placeholder="https://..."
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                    <textarea
                                        rows="3"
                                        className="w-full p-6 rounded-2xl bg-slate-50 border border-slate-100 focus:border-primary outline-none transition-all font-bold"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>
                            </CardContent>
                            <div className="p-8 bg-slate-50 flex gap-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest">Cancel</Button>
                                <Button type="submit" className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Save Lecture</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Video Upload Modal */}
            {showVideoUploadModal && selectedLectureForUpload && (
                <VideoUploadModal
                    lectureId={selectedLectureForUpload}
                    courseId={courseId}
                    onUploadSuccess={handleVideoUploadSuccess}
                    onUploadCancel={() => {
                        setShowVideoUploadModal(false);
                        setSelectedLectureForUpload(null);
                    }}
                />
            )}

            {/* Add Question Modal */}
            {showAddQuestion && selectedLectureId && (
                <AddQuestionModal
                    lectureId={selectedLectureId}
                    onClose={() => {
                        setShowAddQuestion(false);
                        setSelectedLectureId(null);
                    }}
                    onSuccess={() => {
                        console.log('Question created successfully');
                        // Questions will auto-load in LectureViewer
                    }}
                />
            )}

            {/* Question Analytics Modal */}
            {showAnalytics && selectedAnalyticsLectureId && (
                <QuestionAnalytics
                    lectureId={selectedAnalyticsLectureId}
                    onClose={() => {
                        setShowAnalytics(false);
                        setSelectedAnalyticsLectureId(null);
                    }}
                />
            )}
        </div>
    );
};

export default LectureManager;
