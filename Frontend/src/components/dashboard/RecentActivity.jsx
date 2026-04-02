import React from 'react';
import { CheckCircle2, PlayCircle, FileText, MessageSquare, Trophy, ChevronRight } from 'lucide-react';

const RecentActivity = ({ activities }) => {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'lecture_completed':
            case 'lecture_viewed':
                return <PlayCircle className="w-5 h-5 text-blue-400" />;
            case 'quiz_completed':
                return <Trophy className="w-5 h-5 text-purple-400" />;
            case 'assignment_submitted':
                return <FileText className="w-5 h-5 text-orange-400" />;
            case 'comment_posted':
                return <MessageSquare className="w-5 h-5 text-green-400" />;
            default:
                return <CheckCircle2 className="w-5 h-5 text-slate-400" />;
        }
    };

    const getActivityLabel = (activity) => {
        const { type, details, course, student } = activity;
        
        switch (type) {
            case 'lecture_completed':
                return `Completed lecture: ${details || 'Module Lesson'}`;
            case 'lecture_viewed':
                return `Viewed ${details || 'a lecture'} in ${course || 'a course'}`;
            case 'quiz_completed':
                return `Completed quiz: ${details || 'Quiz'}`;
            case 'assignment_submitted':
                return `Submitted assignment: ${details || 'Assignment'}`;
            case 'comment_posted':
                return `Posted a comment in ${course || 'forum'}`;
            default:
                return 'Learning activity recorded';
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'lecture_completed':
            case 'lecture_viewed':
                return 'border-blue-500/20 bg-blue-500/5';
            case 'quiz_completed':
                return 'border-purple-500/20 bg-purple-500/5';
            case 'assignment_submitted':
                return 'border-orange-500/20 bg-orange-500/5';
            case 'comment_posted':
                return 'border-green-500/20 bg-green-500/5';
            default:
                return 'border-slate-600/50 bg-slate-700/20';
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (activities.length === 0) {
        return null;
    }

    // Show most recent activities first
    const recentActivities = [...activities].slice(0, 8);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-white">Recent Activity</h2>
                <p className="text-slate-400 text-sm mt-1">Your learning progress</p>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-2">
                {recentActivities.map((activity, index) => (
                    <div
                        key={index}
                        className={`group bg-slate-800/50 border ${getActivityColor(activity.type)} rounded-lg p-4 hover:border-slate-600/50 hover:shadow-md transition-all duration-300`}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-1">
                                {getActivityIcon(activity.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white">
                                    {getActivityLabel(activity)}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1">
                                    {formatTimeAgo(activity.timestamp || new Date().toISOString())}
                                </p>
                            </div>

                            {/* Status badge */}
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    ✓ Done
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* View All button */}
            <div className="text-center pt-4 border-t border-slate-700/50">
                <a
                    href="/activity-log"
                    className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-primary hover:text-primary/90 border border-primary/30 hover:border-primary/50 rounded-lg transition-all hover:bg-primary/10"
                >
                    View Full Activity Log <ChevronRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

export default RecentActivity;
