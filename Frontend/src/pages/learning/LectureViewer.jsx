import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseDetails, getCourseLectures, getLectureDetails, trackLectureView } from '../../api/student';
import { getLectureQuestions, respondToInLectureQuestion } from '../../api/inLectureQuestions';
import LectureSidebar from '../../components/learning/LectureSidebar';
import LectureQuestionModal from '../../components/learning/LectureQuestionModal';
import EnhancedVideoPlayer from '../../components/learning/EnhancedVideoPlayer';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Play,
    FileText,
    MessageSquare,
    Info,
    Maximize2,
    Settings,
    RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const LectureViewer = () => {
    const { courseId, lectureId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [currentLecture, setCurrentLecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // In-lecture questions state
    const [questions, setQuestions] = useState([]);
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [submittingQuestion, setSubmittingQuestion] = useState(false);
    const [answeredQuestions, setAnsweredQuestions] = useState({});
    
    const [triggeredQuestions, setTriggeredQuestions] = useState([]);
    useEffect(() => {
    setTriggeredQuestions([]);
    setAnsweredQuestions({});
}, [lectureId]);


    useEffect(() => {
    console.log("QUESTIONS UPDATED:", questions);
    }, [questions]);

    useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("👤 CURRENT USER:", user);
}, []);

    useEffect(() => {
        fetchInitialData();
    }, [courseId]);

    useEffect(() => {
        if (lectureId) {
            fetchLectureData(lectureId);
            fetchLectureQuestions(lectureId);
        } else if (lectures.length > 0) {
            // Default to first lecture if none specified
            navigate(`/learning/${courseId}/lecture/${lectures[0]._id}`, { replace: true });
        }
    }, [lectureId, lectures]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [courseRes, lecturesRes] = await Promise.all([
                getCourseDetails(courseId),
                getCourseLectures(courseId)
            ]);
            setCourse(courseRes.data.data.course);
            setLectures(lecturesRes.data.data.lectures);
        } catch (error) {
            console.error('Error fetching course data:', error);
            toast.error('Failed to load course content');
        } finally {
            setLoading(false);
        }
    };

    const fetchLectureData = async (id) => {
        try {
            const response = await getLectureDetails(id);
            setCurrentLecture(response.data.data.lecture);
            // Track view
            trackLectureView(id).catch(err => console.error('Tracking error:', err));
        } catch (error) {
            console.error('Error fetching lecture details:', error);
            toast.error('Failed to load lecture content');
        }
    };

const fetchLectureQuestions = async (id) => {
    try {
        const response = await getLectureQuestions(id);

        const fetchedQuestions = response?.data?.questions || [];

        // ✅ SAFE: only detect answered questions
        const answeredMap = {};

        fetchedQuestions.forEach(q => {
            if (q.studentResponses?.length > 0) {
                answeredMap[q._id] = true;
            }
        });

        console.log("QUESTIONS:", fetchedQuestions);
        console.log("ANSWERED MAP:", answeredMap);

        setAnsweredQuestions(answeredMap);
        setQuestions(fetchedQuestions);

    } catch (error) {
        console.error(error);
    }
};

const handleVideoTimeUpdate = (currentTime) => {
    // ✅ FIX 1: allow time = 0 also
    if (currentTime === undefined || currentTime === null) return;

    // ✅ FIX 2: prevent trigger when modal already open
    if (!questions.length || showQuestionModal) return;

    console.log("⏱ Time Update:", currentTime);
    console.log("📊 Questions:", questions);

    const tolerance = 0.5;

    const nextQuestion = questions.find(q => {
        const timeMarker = Number(q.timeMarker || 0);

        const alreadyTriggered = triggeredQuestions.includes(q._id);
        const alreadyAnswered = answeredQuestions[q._id];

        return (
            !alreadyTriggered &&
            !alreadyAnswered &&
            currentTime >= timeMarker - tolerance
        );
    });

    // ✅ FIX 3: trigger logic outside find (clean)
    if (nextQuestion) {
        console.log("🔥 Triggering question:", nextQuestion.questionText);

        setTriggeredQuestions(prev => [...prev, nextQuestion._id]);
        setActiveQuestion(nextQuestion);
        setShowQuestionModal(true);

        return true; // ✅ pause video
    }
};
    

    const handleAnswerQuestion = async (selectedOption) => {
        if (!activeQuestion) return;

        setSubmittingQuestion(true);
try {
    const response = await respondToInLectureQuestion(
        currentLecture._id,
        activeQuestion._id,
        selectedOption
    );

    const isCorrect = response.data.isCorrect;

    // Save answer
    setAnsweredQuestions(prev => ({
        ...prev,
        [activeQuestion._id]: {
            selectedOption,
            isCorrect,
            pointsAwarded: response.data.pointsAwarded
        }
    }));

    if (isCorrect) {
        toast.success(`Correct! You earned ${response.data.pointsAwarded} point(s)`);

        // ✅ CLOSE MODAL ONLY IF CORRECT
        handleCloseQuestion();

    } else {
        toast.error('Incorrect. Try again');

        // ❌ DO NOTHING → stays stuck
    }

} catch (error) {
    console.error('Error submitting answer:', error);
    toast.error('Failed to submit answer');
} finally {
            setSubmittingQuestion(false);
        }
    };

    const handleCloseQuestion = () => {
        setShowQuestionModal(false);
        // Optionally reset after delay
        setTimeout(() => {
            setActiveQuestion(null);
        }, 300);
    };

    const handleLectureSelect = (id) => {
        navigate(`/learning/${courseId}/lecture/${id}`);
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold text-xl animate-pulse uppercase tracking-[0.2em]">Loading your environment...</div>;
    if (!course) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Course not found</div>;

    const currentLectureIndex = (lectures && Array.isArray(lectures))
        ? lectures.findIndex(l => l._id === currentLecture?._id)
        : -1;
    const prevLecture = (currentLectureIndex > 0) ? lectures[currentLectureIndex - 1] : null;
    const nextLecture = (currentLectureIndex >= 0 && currentLectureIndex < (lectures?.length || 0) - 1)
        ? lectures[currentLectureIndex + 1] : null;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
            {/* In-Lecture Question Modal */}
            {activeQuestion && (
                <LectureQuestionModal
                    question={activeQuestion}
                    onSubmit={handleAnswerQuestion}
                    onClose={handleCloseQuestion}
                    isLoading={submittingQuestion}
                    submittedAnswer={answeredQuestions[activeQuestion._id]?.selectedOption}
                    isCorrect={answeredQuestions[activeQuestion._id]?.isCorrect}
                    pointsAwarded={answeredQuestions[activeQuestion._id]?.pointsAwarded}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Learning Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
                    <div className="flex items-center gap-4">
                        <Link to="/courses/my" className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-white" />
                        </Link>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                        <h1 className="font-bold text-sm md:text-base tracking-tight truncate max-w-[200px] md:max-w-md">
                            {course.courseName}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-primary/30 text-primary uppercase text-[10px] font-black tracking-widest px-3">
                            Currently Watching
                        </Badge>
                        <Button variant="ghost" size="sm" className="hidden md:flex text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]">
                            Share progress
                        </Button>
                    </div>
                </header>

                {/* Main Learning Space */}
                <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col">
                {/* Video Player Section */}
                <div className="relative aspect-video w-full bg-black group overflow-hidden shadow-2xl">
                    {currentLecture ? (
                        <EnhancedVideoPlayer
                            videoUrl={`http://localhost:5000/api/lectures/${currentLecture._id}/stream`}
                            poster={course.thumbnail}
                            onTimeUpdate={handleVideoTimeUpdate}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                <Play className="w-8 h-8 text-primary fill-primary" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">Waiting for stream...</p>
                        </div>
                    )}
                </div>                    {/* Content Details */}
                    <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Lecture {currentLectureIndex + 1}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{currentLecture?.duration} Minutes</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                                    {currentLecture?.title}
                                </h1>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    disabled={!prevLecture}
                                    onClick={() => handleLectureSelect(prevLecture._id)}
                                    variant="outline"
                                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold rounded-xl"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <Button
                                    disabled={!nextLecture}
                                    onClick={() => handleLectureSelect(nextLecture._id)}
                                    className="bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg shadow-primary/20"
                                >
                                    Next Lecture <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-8 mb-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={cn(
                                    "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                                    activeTab === 'overview' ? "text-primary" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Overview
                                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={cn(
                                    "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                                    activeTab === 'notes' ? "text-primary" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                Notes
                                {activeTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"></div>}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-slate-400 text-lg leading-relaxed">
                                            {currentLecture?.description || "No description provided for this lecture. Follow along with the video to learn more about this topic."}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-primary/10">
                                                    <Info className="w-5 h-5 text-primary" />
                                                </div>
                                                <h3 className="font-bold text-white tracking-tight">Key Takeaways</h3>
                                            </div>
                                            <ul className="space-y-3">
                                                {[1, 2, 3].map(i => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                                                        <span className="text-sm text-slate-400">Important concept to master in this module</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-blue-500/10">
                                                    <FileText className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <h3 className="font-bold text-white tracking-tight">Resources</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                    <span className="text-sm text-slate-300">lecture-notes.pdf</span>
                                                    <Badge className="bg-slate-800 text-slate-400 border-none">4.2 MB</Badge>
                                                </button>
                                                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                                    <span className="text-sm text-slate-300">source-code.zip</span>
                                                    <Badge className="bg-slate-800 text-slate-400 border-none">1.5 MB</Badge>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'notes' && (
                                <div className="space-y-6">
                                    <textarea
                                        className="w-full h-64 bg-white/5 border border-white/10 rounded-[2rem] p-8 text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none font-medium text-lg leading-relaxed shadow-inner"
                                        placeholder="Start typing your study notes here..."
                                    ></textarea>
                                    <div className="flex justify-end">
                                        <Button className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-4 rounded-full shadow-2xl shadow-primary/30">
                                            Save Private Note
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Right Sidebar - Course Content */}
            <LectureSidebar
                lectures={lectures}
                currentLectureId={currentLecture?._id}
                onSelect={handleLectureSelect}
                courseName={course.courseName}
                progress={course.attendancePercentage || 0}
            />
        </div>
    );
};

export default LectureViewer;
