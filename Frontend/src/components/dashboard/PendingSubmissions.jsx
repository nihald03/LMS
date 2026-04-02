import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ClipboardCheck, Calendar, Users, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PendingSubmissions = ({ submissions = [] }) => {
    const navigate = useNavigate();

    if (!submissions || submissions.length === 0) {
        return (
            <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900 mb-2">All Caught Up!</h3>
                    <p className="text-sm text-slate-500">No pending submissions to grade</p>
                </CardContent>
            </Card>
        );
    }

    const getUrgencyColor = (daysLeft) => {
        if (daysLeft < 0) return { badge: 'destructive', icon: 'text-red-500', bg: 'bg-red-50 border-red-100' };
        if (daysLeft === 0) return { badge: 'default', icon: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' };
        if (daysLeft <= 2) return { badge: 'secondary', icon: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-100' };
        return { badge: 'outline', icon: 'text-slate-400', bg: 'bg-slate-50 border-slate-100' };
    };

    const getUrgencyLabel = (daysLeft) => {
        if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`;
        if (daysLeft === 0) return 'Due today';
        if (daysLeft === 1) return 'Due tomorrow';
        return `Due in ${daysLeft} days`;
    };

    // Sort by submission count (most submissions first)
    const sortedSubmissions = [...submissions].sort((a, b) => b.submissionCount - a.submissionCount).slice(0, 5);

    return (
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <ClipboardCheck className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black text-slate-900">Pending Submissions</CardTitle>
                            <p className="text-xs text-slate-500 font-medium mt-1">{submissions.length} assignment(s) waiting for grading</p>
                        </div>
                    </div>
                    <Badge variant="destructive" className="font-bold">
                        {submissions.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {sortedSubmissions.map((submission, idx) => {
                    const daysLeft = Math.ceil((new Date(submission.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                    const urgency = getUrgencyColor(daysLeft);

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-md ${urgency.bg}`}
                            onClick={() => {
                                console.log("SUBMISSION:", submission);

                                const assignmentId = submission.assignmentId?._id || submission.assignmentId;

                                console.log("EXTRACTED ID:", assignmentId);

                                navigate(`/teacher/grading/assignment/${assignmentId}?course=${submission.courseId}`);
                            }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                                            {submission.assignmentTitle}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-1">
                                        {submission.courseName}
                                    </p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">
                                                {submission.submissionCount} submission{submission.submissionCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600">
                                                {getUrgencyLabel(daysLeft)}
                                            </span>
                                        </div>
                                        {submission.gradedCount > 0 && (
                                            <Badge variant="outline" className="text-[10px]">
                                                {submission.gradedCount}/{submission.submissionCount} graded
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {submissions.length > 5 && (
                    <Button
                        onClick={() => {
                            if (submissions.length > 0) {
                                const courseId = submissions[0].courseId;
                                navigate(`/teacher/grading?course=${courseId}`);
                            } else {
                                navigate('/teacher/courses');
                            }
                        }}
                        variant="ghost"
                        className="w-full mt-4 text-primary font-bold hover:bg-primary/5"
                    >
                        View All Submissions
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                )}

                {/* Grade Now Button */}
                <Button
                    onClick={() => {
                        if (submissions.length > 0) {
                            const courseId = submissions[0].courseId;
                            navigate(`/teacher/grading?course=${courseId}`);
                        } else {
                            navigate('/teacher/courses');
                        }
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl"
                >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    Start Grading Now
                </Button>

            </CardContent>
        </Card>
    );
};

export default PendingSubmissions;
