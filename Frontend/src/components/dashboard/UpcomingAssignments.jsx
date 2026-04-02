import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

const UpcomingAssignments = ({ assignments = [] }) => {
  const navigate = useNavigate();

  if (!assignments || assignments.length === 0) {
    return null;
  }

  // Sort by due date
  const sortedAssignments = [...assignments].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  // Show only upcoming (next 5)
  const upcomingAssignments = sortedAssignments.slice(0, 5);

  const getDaysRemaining = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgency = (daysRemaining) => {
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining === 0) return 'today';
    if (daysRemaining <= 3) return 'urgent';
    return 'normal';
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <FileText className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Upcoming Assignments</h3>
            <p className="text-sm text-slate-400">Track your assignment deadlines</p>
          </div>
        </div>
        {upcomingAssignments.length > 0 && (
          <button
            onClick={() => navigate('/courses')}
            className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {upcomingAssignments.map((assignment) => {
          const daysRemaining = getDaysRemaining(assignment.dueDate);
          const urgency = getUrgency(daysRemaining);

          return (
            <div
              key={assignment._id}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/50 ${
                urgency === 'overdue'
                  ? 'bg-red-500/5 border-red-500/20'
                  : urgency === 'today'
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : urgency === 'urgent'
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-slate-700/30 border-slate-600'
              }`}
              onClick={() => navigate(`/assignments/${assignment._id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-white truncate">
                      {assignment.title}
                    </h4>
                    <Badge className={
                      urgency === 'overdue'
                        ? 'bg-red-500/20 text-red-300'
                        : urgency === 'today'
                        ? 'bg-orange-500/20 text-orange-300'
                        : urgency === 'urgent'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-slate-600/50 text-slate-300'
                    }>
                      {urgency === 'overdue' ? '⚠️ Overdue' : `${daysRemaining} days`}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {assignment.description || 'No description'}
                  </p>
                </div>

                {/* Right Content */}
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <Badge className="bg-slate-700 text-slate-300 capitalize">
                    {assignment.submissionType}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-slate-700 flex gap-2">
        <button
          onClick={() => navigate('/courses')}
          className="flex-1 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg transition-all text-sm"
        >
          View All Assignments
        </button>
        <button
          onClick={() => navigate('/courses/my')}
          className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all text-sm"
        >
          Go to My Courses
        </button>
      </div>
    </div>
  );
};

export default UpcomingAssignments;
