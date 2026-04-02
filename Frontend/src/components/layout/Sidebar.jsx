import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Video,
    FileText,
    Settings,
    LogOut,
    Users,
    BarChart,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    Award
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    const studentLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'My Courses', path: '/courses/my', icon: BookOpen },
        { name: 'Assignments', path: '/student/assignments', icon: FileText },
        { name: 'Catalog', path: '/courses', icon: GraduationCap },
        { name: 'Achievements', path: '/certificates', icon: Award },
        { name: 'Quizzes', path: '/quizzes', icon: FileText },
        { name: 'Profile', path: '/profile', icon: Settings },
    ];

    const teacherLinks = [
        { name: 'Teacher Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'Manage Courses', path: '/teacher/courses', icon: BookOpen },
        { name: 'Students', path: '/teacher/students', icon: Users },
        { name: 'Analytics', path: '/teacher/analytics', icon: BarChart },
        { name: 'Profile', path: '/profile', icon: Settings },
    ];

    const adminLinks = [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Site Analytics', path: '/admin/analytics', icon: BarChart },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const links = user?.role === 'admin' ? adminLinks : user?.role === 'teacher' ? teacherLinks : studentLinks;

    return (
        <aside
            className={cn(
                "flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out h-screen sticky top-0",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 h-16">
                {!collapsed && <span className="font-bold text-xl tracking-tight text-primary">LMS Portal</span>}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 ml-auto"
                >
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </Button>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:text-white")} />
                            {!collapsed && <span className="font-medium truncate">{link.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 group"
                    )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
