import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courses';
import CourseCard from '../../components/courses/CourseCard';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, Filter, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CourseCatalog = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');

    const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science'];
    const levels = ['All', 'beginner', 'intermediate', 'advanced'];

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedCategory !== 'All') params.category = selectedCategory;
            if (selectedLevel !== 'All') params.level = selectedLevel;

            const response = await getAllCourses(params);
            // Backend returns { data: { courses: [], count: 2 } }
            const coursesData = response.data.data?.courses || response.data.data || [];
            setCourses(coursesData);
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to load courses');
            // Mock data for demo purposes if API fails
            setCourses([
                {
                    _id: '1',
                    title: 'Complete Web Development Bootcamp 2024',
                    description: 'Become a full-stack web developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB and more!',
                    instructor: { name: 'Dr. Angela Yu' },
                    category: 'Programming',
                    level: 'beginner',
                    duration: 65,
                    enrollmentCount: 15420,
                    averageRating: 4.8,
                },
                {
                    _id: '2',
                    title: 'Graphic Design Masterclass - Learn GREAT Design',
                    description: 'The Ultimate Guide to Graphic Design. Master Photoshop, Illustrator, InDesign, Design Theory, Branding and Logo Design.',
                    instructor: { name: 'Lindsay Marsh' },
                    category: 'Design',
                    level: 'intermediate',
                    duration: 28,
                    enrollmentCount: 8900,
                    averageRating: 4.7,
                },
                {
                    _id: '3',
                    title: 'Business Analysis Fundamentals',
                    description: 'The absolute beginners guide to business analysis. Learn what a business analyst does and how to get the job!',
                    instructor: { name: 'Jeremy Aschenbrenner' },
                    category: 'Business',
                    level: 'beginner',
                    duration: 12,
                    enrollmentCount: 5600,
                    averageRating: 4.5,
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course => {
        const title = course.courseName || course.title || '';
        const category = course.department || course.category || '';
        return title.toLowerCase().includes(search.toLowerCase()) ||
            category.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Explore Courses</h1>
                    <p className="text-slate-500 text-lg">Pick a course and start your learning journey today.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-10 px-3 flex items-center gap-2 font-medium">
                        <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 px-3 flex items-center gap-2 font-medium text-slate-400">
                        <List className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Filters */}
                <aside className="lg:col-span-1 space-y-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Search className="w-4 h-4" /> Search
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Course name..."
                                className="pl-10 h-11 bg-white border-slate-200"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Categories
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <Badge
                                    key={cat}
                                    variant={selectedCategory === cat ? "default" : "outline"}
                                    className={cn(
                                        "px-3 py-1.5 cursor-pointer text-xs font-semibold transition-all hover:scale-105",
                                        selectedCategory === cat ? "shadow-md shadow-primary/20" : "bg-white text-slate-600 border-slate-200"
                                    )}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" /> Level
                        </h3>
                        <div className="space-y-2">
                            {levels.map(lvl => (
                                <div
                                    key={lvl}
                                    onClick={() => setSelectedLevel(lvl)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                                        selectedLevel === lvl
                                            ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    <span className="capitalize">{lvl}</span>
                                    {selectedLevel === lvl && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full h-11 font-bold tracking-tight shadow-lg shadow-primary/20"
                        onClick={fetchCourses}
                    >
                        Apply Filters
                    </Button>
                </aside>

                {/* Course Grid */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-[420px] rounded-xl bg-slate-100 animate-pulse border border-slate-200"></div>
                            ))}
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCourses.map(course => (
                                <CourseCard key={course._id} course={course} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-center px-4">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <Search className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No courses found</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">We couldn't find any courses matching your search criteria. Try a different search term or category.</p>
                            <Button variant="ghost" className="mt-6 text-primary" onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedLevel('All'); }}>
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const cn = (...inputs) => {
    return inputs.filter(Boolean).join(' ');
};

export default CourseCatalog;
