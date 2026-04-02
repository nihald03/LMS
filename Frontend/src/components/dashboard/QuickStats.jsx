import React from 'react';
import { BookOpen, Zap, CheckCircle, Award } from 'lucide-react';

const QuickStats = ({ totalCourses, completedCourses, inProgressCourses, overallGPA }) => {
    const stats = [
        {
            label: 'Courses Enrolled',
            value: totalCourses,
            icon: BookOpen,
            color: 'from-blue-500/20 to-blue-600/20',
            iconColor: 'text-blue-400',
            borderColor: 'border-blue-500/20'
        },
        {
            label: 'In Progress',
            value: inProgressCourses,
            icon: Zap,
            color: 'from-yellow-500/20 to-yellow-600/20',
            iconColor: 'text-yellow-400',
            borderColor: 'border-yellow-500/20'
        },
        {
            label: 'Completed',
            value: completedCourses,
            icon: CheckCircle,
            color: 'from-green-500/20 to-green-600/20',
            iconColor: 'text-green-400',
            borderColor: 'border-green-500/20'
        },
        {
            label: 'Overall GPA',
            value: overallGPA.toFixed(2),
            icon: Award,
            color: 'from-purple-500/20 to-purple-600/20',
            iconColor: 'text-purple-400',
            borderColor: 'border-purple-500/20'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm border ${stat.borderColor} rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-700/50 transition-all duration-300 transform hover:scale-105`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-white/5 rounded-lg ${stat.iconColor}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                {stat.label.split(' ')[0]}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-4xl font-black text-white">
                                {stat.value}
                            </h3>
                            <p className="text-sm text-slate-400 font-medium">
                                {stat.label}
                            </p>
                        </div>

                        {/* Progress bar for certain stats */}
                        {stat.label === 'In Progress' && totalCourses > 0 && (
                            <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(inProgressCourses / totalCourses) * 100}%` }}
                                ></div>
                            </div>
                        )}

                        {stat.label === 'Completed' && totalCourses > 0 && (
                            <div className="mt-4 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-green-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${(completedCourses / totalCourses) * 100}%` }}
                                ></div>
                            </div>
                        )}

                        {stat.label === 'Overall GPA' && (
                            <div className="mt-4 flex items-center gap-2">
                                <div className="text-xs font-semibold text-slate-400">
                                    {overallGPA >= 3.5 && <span className="text-green-400">Excellent</span>}
                                    {overallGPA >= 3.0 && overallGPA < 3.5 && <span className="text-blue-400">Good</span>}
                                    {overallGPA >= 2.5 && overallGPA < 3.0 && <span className="text-yellow-400">Satisfactory</span>}
                                    {overallGPA < 2.5 && <span className="text-red-400">Needs Improvement</span>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default QuickStats;
