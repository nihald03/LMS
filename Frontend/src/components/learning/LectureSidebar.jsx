import React from 'react';
import { cn } from "../../lib/utils";
import { PlayCircle, CheckCircle2, Lock, ChevronRight } from "lucide-react";

const LectureSidebar = ({ lectures, currentLectureId, onSelect, courseName, progress = 0 }) => {
    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-100 w-80 shrink-0">
            <div className="p-6 border-b border-slate-50">
                <h3 className="font-black text-slate-900 tracking-tight line-clamp-2 uppercase text-xs text-slate-400 mb-2">
                    Course Content
                </h3>
                <h2 className="font-black text-lg tracking-tighter text-slate-900 line-clamp-2">
                    {courseName}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {Array.isArray(lectures) && lectures.map((lecture, index) => {
                    const isActive = currentLectureId === lecture._id;
                    const isLocked = false; // Logic for locking can be added later

                    return (
                        <button
                            key={lecture?._id}
                            disabled={isLocked}
                            onClick={() => onSelect(lecture?._id)}
                            className={cn(
                                "w-full flex items-start gap-4 px-6 py-4 transition-all duration-300 border-l-4 text-left group",
                                isActive
                                    ? "bg-primary/[0.03] border-primary"
                                    : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                            )}
                        >
                            <div className={cn(
                                "mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors",
                                isActive
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                            )}>
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                                <p className={cn(
                                    "font-bold tracking-tight line-clamp-2 transition-colors",
                                    isActive ? "text-primary" : "text-slate-700 group-hover:text-slate-900"
                                )}>
                                    {lecture?.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <PlayCircle className="w-3 h-3" />
                                    <span>{lecture?.duration || '0'}m</span>
                                </div>
                            </div>

                            {isLocked ? (
                                <Lock className="w-4 h-4 text-slate-300 mt-1" />
                            ) : (
                                <ChevronRight className={cn(
                                    "w-4 h-4 mt-1 transition-all duration-300",
                                    isActive ? "text-primary opacity-100" : "text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Progress</span>
                    <span className="text-xs font-black text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default LectureSidebar;
