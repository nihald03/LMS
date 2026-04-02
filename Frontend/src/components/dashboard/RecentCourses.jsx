import React from 'react';
import { ChevronRight, BookOpen, User } from 'lucide-react';

const RecentCourses = ({ courses, onCourseClick }) => {
    const recentCourses = courses.slice(0, 4);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">Your Learning</h2>
                    <p className="text-slate-400 text-sm mt-1">Continue where you left off</p>
                </div>
                <a
                    href="/courses/my"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary/90 font-semibold rounded-lg transition-all border border-primary/30 hover:border-primary/50"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </a>
            </div>

            {/* Courses Grid */}
            {recentCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {recentCourses.map((course) => (
                        <div
                            key={course._id}
                            className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                        >
                            {/* Course Header Background */}
                            <div className="h-32 bg-gradient-to-br from-primary/20 to-blue-600/20 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:scale-110 transition-transform duration-500"></div>
                                <div className="absolute top-3 right-3 bg-primary/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                                    {course.enrollmentStatus === 'active' ? 'In Progress' : course.enrollmentStatus}
                                </div>
                            </div>

                            {/* Course Content */}
                            <div className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-white line-clamp-2 group-hover:text-primary transition-colors">
                                        {course.title || course.courseName}
                                    </h3>
                                    <p className="text-sm text-slate-400 flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {course.assignedTeacher?.name || 'Instructor'}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400 font-semibold">Progress</span>
                                        <span className="text-primary font-bold">{course.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-primary to-blue-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        {course.duration || 0} hrs
                                    </span>
                                    <span>{course.enrollmentStatus === 'completed' ? 'Completed' : `${100 - (course.progress || 0)}% left`}</span>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => onCourseClick(course._id)}
                                    className="w-full mt-4 px-4 py-2 bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-white font-semibold rounded-lg transition-all duration-300"
                                >
                                    {course.enrollmentStatus === 'completed' ? 'View Course' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-12 text-center">
                    <p className="text-slate-400 mb-4">No courses enrolled yet</p>
                    <a
                        href="/courses/my"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary/90 font-semibold rounded-lg transition-all"
                    >
                        Explore Courses <ChevronRight className="w-4 h-4" />
                    </a>
                </div>
            )}
        </div>
    );
};

export default RecentCourses;
