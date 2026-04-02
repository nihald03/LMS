import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';

const WelcomeSection = ({ studentName, totalCourses }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const motivationalQuotes = [
        "Keep pushing your limits and stay consistent!",
        "Every lecture brings you closer to your goals!",
        "You're making great progress. Keep it up!",
        "Learning today, leading tomorrow!",
        "Your education is an investment in yourself!",
        "Progress over perfection. Keep learning!"
    ];

    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800/50 via-primary/10 to-slate-800/50 rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-slate-700/50 backdrop-blur-sm">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left side - Greeting */}
                <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                            {getGreeting()}, {studentName}!
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black leading-tight">
                        Welcome Back to Your <span className="text-primary italic">Learning Journey</span>
                    </h1>

                    <p className="text-slate-300 text-lg max-w-lg font-medium">
                        {randomQuote}
                    </p>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4">
                        <a
                            href="/courses/my"
                            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all border border-white/20 hover:border-white/40 flex items-center gap-2"
                        >
                            <BookOpen className="w-4 h-4" />
                            Continue Learning
                        </a>
                        <a
                            href="/courses"
                            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:shadow-primary/20"
                        >
                            Browse Courses
                        </a>
                    </div>
                </div>

                {/* Right side - Visual */}
                <div className="hidden md:flex items-center justify-center">
                    <div className="relative w-48 h-48">
                        {/* Animated circles */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse"></div>
                        <div className="absolute inset-8 rounded-full bg-primary/30 blur-xl animate-pulse delay-100"></div>
                        
                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-6xl font-black text-primary/40">
                                {totalCourses}
                            </div>
                        </div>

                        {/* Corner badges */}
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                            Active
                        </div>
                        <div className="absolute -bottom-2 -left-2 bg-blue-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Learning
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeSection;
