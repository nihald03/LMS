import React, { useState, useEffect } from 'react';
import { getEnrolledCourses } from '../../api/student';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Award,
    Download,
    Share2,
    ExternalLink,
    Search,
    Filter,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Certificates = () => {
    const [completedCourses, setCompletedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            const response = await getEnrolledCourses();
            // Backend returns { success: true, data: { enrollments: [...] } }
            console.log("ENROLLMENTS:", response.data);
            const enrollments = Array.isArray(response.data.data?.enrollments)
                ? response.data.data.enrollments
                : [];
            // Filter only completed courses
            const completed = enrollments.filter(enrollment => enrollment.status === 'completed');
            setCompletedCourses(completed);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            toast.error('Failed to load certificates');
        } finally {
            setLoading(false);
        }
    };

    const filteredCertificates = completedCourses.filter(enrollment =>
        enrollment.courseId?.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning Achievement Gallery...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative bg-slate-900 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 p-12 md:p-16 text-white overflow-hidden rounded-b-[4rem] shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-blue-500/5 blur-[80px] rounded-full"></div>

                <div className="relative z-10 max-w-4xl space-y-6">
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                        Achievement Gallery
                    </Badge>
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-tight">
                        Your Academic <span className="text-primary italic">Milestones.</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                        Every certificate represents hours of dedication and mastery. Showcase your expertise to the world.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between px-4">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search certificates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-14 pr-8 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold transition-all"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex-1 md:flex-none">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                    <Badge variant="secondary" className="h-14 px-8 rounded-2xl bg-slate-100 text-slate-600 border-none font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        {completedCourses.length} Earned
                    </Badge>
                </div>
            </div>

            {/* Certificates Grid */}
            {filteredCertificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
                    {filteredCertificates.map((enrollment) => (
                        <Card key={enrollment._id} className="group border-none shadow-xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500">
                            <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center p-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-50 opacity-50"></div>
                                {/* Certificate Visual Mock */}
                                <div className="relative z-10 w-full h-full border-4 border-white shadow-2xl rounded-xl bg-white flex flex-col items-center justify-center p-4 space-y-2">
                                    <Award className="w-12 h-12 text-primary" />
                                    <div className="h-1 w-12 bg-slate-100 rounded-full"></div>
                                    <div className="h-1 w-20 bg-slate-50 rounded-full"></div>
                                    <div className="absolute bottom-4 right-4 opacity-10">
                                        <Award className="w-12 h-12" />
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px] uppercase">Verified</Badge>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Issued {new Date(enrollment.completionDate || enrollment.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {enrollment.courseId?.courseName || 'Untitled Course'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                        <CheckCircle2 className="w-4 h-4 text-primary" /> Grade: {enrollment.grade || 'A'}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-50">
                                    <Button className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                                        <Download className="w-4 h-4 mr-2" /> PDF
                                    </Button>
                                    <Button variant="outline" className="flex-1 rounded-xl font-black text-xs uppercase tracking-widest border-slate-200">
                                        <Share2 className="w-4 h-4 mr-2" /> Share
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="py-32 px-4 text-center space-y-6 animate-in fade-in duration-700">
                    <div className="mx-auto w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                        <Award className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">No achievements yet.</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">Complete courses to earn official certificates and showcase them here.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Certificates;
