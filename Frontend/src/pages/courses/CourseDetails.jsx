import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, enrollInCourse } from '../../api/courses';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import {
    Clock,
    Users,
    Star,
    BookOpen,
    CheckCircle2,
    PlayCircle,
    ChevronRight,
    ShieldCheck,
    Calendar,
    Languages,
    Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        setLoading(true);
        try {
            const response = await getCourseById(courseId);
            // Backend might return { data: { ...course } }
            setCourse(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching course details:', error);
            // Mock data for demo if API fails
            setCourse({
                _id: courseId,
                courseName: 'Complete Web Development Bootcamp 2024',
                description: 'Become a full-stack web developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB and more!',
                assignedTeacher: { name: 'Dr. Angela Yu' },
                department: 'Programming',
                level: 'beginner',
                duration: 65,
                enrolledStudents: 15420,
                averageRating: 4.8,
                price: 99.99,
                syllabus: 'Week 1-4: Programming Basics, Week 5-8: Data Structures, Week 9-12: Algorithms',
                lectures: [
                    { _id: 'l1', title: 'Introduction to Web Development', duration: 15 },
                    { _id: 'l2', title: 'HTML5 Foundations', duration: 45 },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await enrollInCourse(courseId);
            toast.success('Successfully enrolled in the course!');
            navigate(`/dashboard`);
        } catch (error) {
            console.error('Enrollment error:', error);
            const message = error.response?.data?.message || 'Enrollment failed';
            toast.error(message);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading course details...</div>;
    if (!course) return <div className="p-8 text-center text-red-500 font-bold uppercase tracking-widest">Course not found</div>;

    const title = course.courseName || course.title || 'Untitled Course';
    const instructorName = course.assignedTeacher?.name || course.instructor?.name || 'Staff';
    const category = course.department || course.category || 'General';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
            {/* Hero Section */}
            <section className="relative bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 p-8 md:p-12 lg:p-16 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-primary hover:bg-primary/90 text-white px-3 py-1 text-xs font-bold uppercase tracking-wide border-none">
                                {category}
                            </Badge>
                            <Badge variant="outline" className="border-slate-700 text-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wide capitalize">
                                {course.level || 'Beginner'}
                            </Badge>
                            {course.courseCode && <Badge className="bg-amber-500 text-white border-none">{course.courseCode}</Badge>}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                            {title}
                        </h1>

                        <p className="text-slate-300 text-lg md:text-xl max-w-3xl leading-relaxed">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-slate-100 uppercase tracking-tighter">{course.averageRating || '4.5'} Rating</span>
                                <span className="text-slate-400 uppercase tracking-tighter">({course.enrolledStudents || 0} students enrolled)</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-medium">
                                <UserCircle className="w-5 h-5" />
                                <span>Created by <span className="text-primary font-bold hover:underline cursor-pointer">{instructorName}</span></span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Last updated {course.lastUpdated || 'Recently'}</span>
                            <span className="flex items-center gap-2"><Languages className="w-4 h-4" /> {course.language || 'English'}</span>
                        </div>
                    </div>

                    {/* Floating Purchase Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-2xl border-none overflow-hidden bg-white text-slate-900 transform transition-all hover:scale-[1.01]">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center relative group cursor-pointer">
                                <img src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800`} alt="preview" className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                                </div>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg text-slate-900">
                                    Preview Course
                                </div>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black tracking-tighter">${course.price || 'FREE'}</span>
                                    {course.price && <span className="text-slate-400 line-through text-lg">$199.99</span>}
                                </div>

                                <Button
                                    className="w-full h-14 text-lg font-black tracking-tight rounded-xl shadow-xl shadow-primary/30 transition-all hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-primary/40"
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                >
                                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                </Button>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-800">This course includes:</p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-sm text-slate-600 font-medium tracking-tight border-b border-slate-50 pb-2">
                                            <PlayCircle className="w-4 h-4 text-primary" /> {course.duration} hours on-demand video
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-600 font-medium tracking-tight border-b border-slate-50 pb-2">
                                            <BookOpen className="w-4 h-4 text-primary" /> Full lifetime access
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-600 font-medium tracking-tight border-b border-slate-50 pb-2">
                                            <ShieldCheck className="w-4 h-4 text-primary" /> Mobile and TV access
                                        </li>
                                        <li className="flex items-center gap-3 text-sm text-slate-600 font-medium tracking-tight border-b border-slate-50 pb-2">
                                            <Award className="w-4 h-4 text-primary" /> Certificate of completion
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Course Content Section */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 pb-20">
                <div className="lg:col-span-2 space-y-12">
                    {/* Outcomes */}
                    <section className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                        <h2 className="text-2xl font-black tracking-tighter mb-8 flex items-center gap-2">
                            What you'll learn
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(course.outcomes || []).map((outcome, idx) => (
                                <div key={idx} className="flex gap-3 group">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-slate-700 text-sm md:text-base font-medium leading-normal">{outcome}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Curriculum / Syllabus */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-3xl font-black tracking-tighter">Course Content</h2>
                            {course.lectures && course.lectures.length > 0 && (
                                <span className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                    {course.lectures.length} Lectures • {course.duration}h total
                                </span>
                            )}
                        </div>

                        {course.lectures && course.lectures.length > 0 ? (
                            <div className="space-y-4">
                                {course.lectures.map((lecture, idx) => (
                                    <div
                                        key={lecture._id}
                                        className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary group-hover:text-white transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{lecture.title}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Video • {lecture.duration}m</p>
                                            </div>
                                        </div>
                                        <PlayCircle className="w-5 h-5 text-slate-300 group-hover:text-primary transition-all group-hover:scale-110" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-line font-medium italic">
                                    {course.syllabus || "No syllabus available for this course yet."}
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

const UserCircle = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default CourseDetails;
