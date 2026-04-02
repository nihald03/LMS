import React from 'react';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const UpcomingDeadlines = ({ deadlines }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysUntil = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const getPriorityColor = (priority, daysLeft) => {
        if (daysLeft <= 1) return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (priority === 'high') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        if (priority === 'medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    };

    const getIcon = (type) => {
        switch (type) {
            case 'quiz':
                return <CheckCircle2 className="w-5 h-5" />;
            case 'assignment':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <Calendar className="w-5 h-5" />;
        }
    };

    if (deadlines.length === 0) {
        return null;
    }

    // Sort deadlines by date
    const sortedDeadlines = [...deadlines].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-white">Upcoming Deadlines</h2>
                <p className="text-slate-400 text-sm mt-1">Stay on top of your coursework</p>
            </div>

            {/* Deadlines List */}
            <div className="space-y-3">
                {sortedDeadlines.map((deadline, index) => {
                    const daysLeft = getDaysUntil(deadline.dueDate);
                    const isUrgent = daysLeft <= 1;
                    const isOverdue = daysLeft < 0;

                    return (
                        <div
                            key={index}
                            className={`group bg-slate-800/50 border ${getPriorityColor(deadline.priority, daysLeft)} rounded-xl p-5 hover:shadow-lg transition-all duration-300 ${isUrgent ? 'border-red-500/40 bg-red-500/5' : 'border-slate-700/50'}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                {/* Left side - Icon and content */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-2 rounded-lg ${getPriorityColor(deadline.priority, daysLeft)} flex-shrink-0 mt-1`}>
                                        {getIcon(deadline.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-white capitalize">
                                                    {deadline.type === 'assignment' ? '📋' : '📝'} {deadline.title}
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    in <span className="text-slate-300 font-semibold">{deadline.course}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Date and status */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(deadline.dueDate)}
                                            </span>

                                            {/* Time remaining badge */}
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                                                isOverdue
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : isUrgent
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : daysLeft <= 3
                                                    ? 'bg-orange-500/20 text-orange-400'
                                                    : 'bg-slate-600/50 text-slate-300'
                                            }`}>
                                                <Clock className="w-3 h-3" />
                                                {isOverdue ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right side - Action button */}
                                <button className="px-4 py-2 bg-primary/20 border border-primary/50 text-primary hover:bg-primary hover:text-white font-semibold rounded-lg transition-all duration-300 flex-shrink-0">
                                    View
                                </button>
                            </div>

                            {/* Urgent indicator line */}
                            {isUrgent && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-red-500 rounded-l-xl"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary card */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700/50 rounded-xl p-4">
                <p className="text-sm text-slate-400">
                    <span className="font-bold text-white">
                        {sortedDeadlines.filter(d => getDaysUntil(d.dueDate) <= 3 && getDaysUntil(d.dueDate) >= 0).length}
                    </span>{' '}
                    deadline(s) in the next 3 days
                </p>
            </div>
        </div>
    );
};

export default UpcomingDeadlines;
