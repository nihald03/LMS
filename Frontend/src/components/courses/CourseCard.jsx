import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
    const title = course.courseName || course.title || 'Untitled Course';
    const category = course.department || course.category || 'General';
    const instructorName = course.assignedTeacher?.name || course.instructor?.name || 'Staff';
    const enrolledCount = course.enrolledStudents !== undefined ? course.enrolledStudents : (course.enrollmentCount || 0);

    return (
        <Card className="overflow-hidden h-full flex flex-col group hover:shadow-xl transition-all duration-300 border-slate-200">
            <div className="relative aspect-video bg-slate-100 overflow-hidden">
                <img
                    src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60`}
                    alt={title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-white/90 text-slate-900 hover:bg-white border-none shadow-sm capitalize">
                        {category}
                    </Badge>
                </div>
                {course.courseCode && (
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-slate-900/80 text-white border-none">
                            {course.courseCode}
                        </Badge>
                    </div>
                )}
            </div>

            <CardHeader className="p-5 pb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                    <span className="flex items-center gap-1 capitalize">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase tracking-tighter">
                            {course.level || 'Beginner'}
                        </Badge>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {course.duration || 'Variable'} hrs
                    </span>
                </div>
                <CardTitle className="text-xl font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-5 pt-0 flex-1">
                <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                    {course.description}
                </p>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{enrolledCount} Students</span>
                    </div>
                    {course.averageRating && (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold text-slate-700">{course.averageRating}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 border-t border-slate-50 mt-auto bg-slate-50/50">
                <div className="flex items-center justify-between w-full pt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {instructorName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{instructorName}</span>
                    </div>
                   <Link to={`/courses/${course._id}`}>
                        <Button size="sm" className="font-semibold rounded-lg">
                            View Details
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
};

const CardTitle = ({ children, className }) => (
    <h3 className={className}>{children}</h3>
);

export default CourseCard;
