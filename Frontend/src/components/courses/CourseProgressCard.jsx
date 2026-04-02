import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Clock, BookOpen, UserCircle } from "lucide-react";

const CourseProgressCard = ({ course }) => {
    // Mock progress calculation for now
    const progress = course.progress || 0;
    const title = course.courseName || course.title || 'Untitled Course';
    const instructor = course.assignedTeacher?.name || 'Instructor';

    return (
        <Card className="group overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl bg-white">
            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                    src={course.thumbnail || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800`}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{course.duration || '0'}h total</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <UserCircle className="w-4 h-4" />
                        <span>{instructor}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        asChild
                        className="w-full h-11 rounded-xl bg-slate-900 hover:bg-primary hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 font-bold group/btn"
                    >
                        <Link to={`/learning/${course._id || course.courseId?._id}`}>
                            <PlayCircle className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            Continue Learning
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default CourseProgressCard;
